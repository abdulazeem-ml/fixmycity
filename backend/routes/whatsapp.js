const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');
const axios = require('axios');
const Fuse = require('fuse.js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Temporary store for pending reports
// Holds image or location until both arrive
const pendingReports = {};

const CIVIC_KEYWORDS = [
  'pothole', 'garbage', 'flood', 'drain', 'streetlight',
  'road', 'waterlog', 'sewage', 'waste', 'broken',
  'manhole', 'footpath', 'pavement', 'tree', 'light',
  'water', 'dirty', 'damage', 'blocked', 'overflow',
  'construction', 'encroachment', 'stray', 'animal'
];

const fuse = new Fuse(CIVIC_KEYWORDS, {
  threshold: 0.4,
  includeScore: true,
});

function isCivicMessage(message) {
  if (!message || message.trim() === '') return true;
  const words = message.toLowerCase().split(/\s+/);
  return words.some(word => fuse.search(word).length > 0);
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function validateImage(imageUrl) {
  // ML validation skipped for now — add Vision API key later
  return true;
}

async function uploadImage(imageUrl) {
  // Return Twilio URL directly — skip upload for now
  // Twilio URLs expire after a while but work for demo
  return imageUrl;
}

function detectType(message) {
  if (!message) return 'other';
  const msg = message.toLowerCase();
  if (msg.includes('pothole') || msg.includes('puthole')) return 'pothole';
  if (msg.includes('garbage') || msg.includes('waste') || msg.includes('trash')) return 'garbage';
  if (msg.includes('flood') || msg.includes('water') || msg.includes('waterlog')) return 'waterlogging';
  if (msg.includes('light') || msg.includes('streetlight')) return 'streetlight';
  if (msg.includes('drain') || msg.includes('sewage') || msg.includes('manhole')) return 'sewage';
  if (msg.includes('tree')) return 'tree';
  if (msg.includes('footpath') || msg.includes('pavement')) return 'footpath';
  return 'other';
}

async function sendReply(to, message) {
  await twilioClient.messages.create({
    from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
    to: `whatsapp:${to}`,
    body: message
  });
}

function calcPriority(reportCount, severity, daysUnresolved) {
  return (reportCount * 0.4) + (severity * 0.3) +
    (daysUnresolved * 0.2) + (1 * 0.1);
}

async function processReport(userPhone, pending) {
  console.log('🔄 Processing report for:', userPhone, pending);

  const { imageUrl, lat, lng, message } = pending;

  // Send immediate acknowledgment first to avoid webhook timeouts
  await sendReply(userPhone, '⏳ Processing your report...')

  // NLP check
  if (!isCivicMessage(message)) {
    await sendReply(userPhone,
      '❌ Your message does not describe a civic issue.\n\nPlease describe the problem (e.g. "pothole", "garbage") and resend with photo.'
    );
    return;
  }

  // ML check
  const isValidImage = await validateImage(imageUrl);
  if (!isValidImage) {
    await sendReply(userPhone,
      '❌ Could not identify a civic issue in your photo.\n\nPlease take a clearer photo and resend.'
    );
    return;
  }

  // Upload image
  const uploadedUrl = await uploadImage(imageUrl);
  console.log('✅ Image URL:', uploadedUrl);

  // Check nearby issues
  const { data: allIssues, error: fetchError } = await supabase
    .from('issues')
    .select('*')
    .neq('status', 'resolved');
  console.log('📊 Issues fetched:', allIssues?.length, 'Error:', fetchError);

  const issueType = detectType(message);

  const nearby = allIssues?.find(issue =>
    getDistance(lat, lng, issue.lat, issue.lng) <= 30
  );

  try {
    if (nearby) {
      console.log('🔍 Found nearby issue:', nearby.id);
      const newCount = nearby.report_count + 1;
      const days = Math.floor(
        (Date.now() - new Date(nearby.created_at)) / 86400000
      );
      const { error: updateError } = await supabase
        .from('issues')
        .update({
          report_count: newCount,
          image_urls: [...(nearby.image_urls || []), uploadedUrl],
          last_updated: new Date().toISOString(),
          priority_score: calcPriority(newCount, nearby.severity, days),
          reporter_phones: [...(nearby.reporter_phones || []), userPhone],
        })
        .eq('id', nearby.id);

      if (updateError) {
        console.error('❌ Update error:', updateError);
        return;
      }
      console.log('✅ Issue updated successfully');

      const remaining = Math.max(0, 12 - newCount);
      const mapMsg = newCount >= 12
        ? '🗺️ This issue is now visible on the public map!'
        : `⏳ ${remaining} more reports needed to appear on the map.`;

      await sendReply(userPhone,
        `✅ Report received! *${newCount} people* reported this issue.\n\n${mapMsg}\n\nThank you! 🏙️`
      );
      console.log('📤 Reply sent to user');
    } else {
      console.log('🆕 Creating new issue');
      // Reverse geocode for ward/city
      let ward = 'General';
      let authority = 'City Municipal Corporation';
      try {
        const geo = await axios.get(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          { headers: { 'User-Agent': 'FixMyCity/1.0' } }
        );
        const addr = geo.data.address;
        ward = addr.suburb || addr.neighbourhood || addr.county || 'General';
        const city = addr.city || addr.town || addr.village || '';
        authority = `${city} Municipal Corporation`;
        console.log('📍 Geocoded:', ward, authority);
      } catch (e) {
        console.error('Geocode error:', e.message);
      }

      const { error: insertError } = await supabase
        .from('issues')
        .insert({
          lat,
          lng,
          type: issueType,
          image_urls: [uploadedUrl],
          report_count: 1,
          severity: 1,
          status: 'reported',
          authority,
          ward,
          priority_score: calcPriority(1, 1, 0),
          reporter_phones: [userPhone],
        });

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        return;
      }
      console.log('✅ New issue created successfully');

      await sendReply(userPhone,
        `✅ Issue reported!\n\n📍 *Type:* ${issueType}\n📍 *Area:* ${ward}\n\n11 more reports needed to appear on public map.\n\nShare with others who see the same issue! 🚀`
      );
      console.log('📤 Reply sent to user');
    }
  } catch (err) {
    console.error('❌ Process report error:', err.message);
  }

  // Clear pending
  delete pendingReports[userPhone];
  console.log('🧹 Cleared pending report for:', userPhone);
}

// MAIN WEBHOOK
router.post('/webhook', async (req, res) => {
  console.log('🔔 WEBHOOK HIT:', new Date().toISOString())
  console.log('BODY:', JSON.stringify(req.body))

  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');

  try {
    const {
      From, Body, MediaUrl0,
      Latitude, Longitude,
      NumMedia, MessageType
    } = req.body;

    const userPhone = From.replace('whatsapp:', '');
    const message = Body || '';

    console.log(`📱 Message from ${userPhone}: type=${MessageType}, media=${NumMedia}`);

    // Initialize pending store for user
    if (!pendingReports[userPhone]) {
      pendingReports[userPhone] = {};
    }

    // Handle location message
    if (MessageType === 'location' || (Latitude && Longitude)) {
      pendingReports[userPhone].lat = parseFloat(Latitude);
      pendingReports[userPhone].lng = parseFloat(Longitude);
      console.log(`📍 Got location for ${userPhone}`);

      if (pendingReports[userPhone].imageUrl) {
        await sendReply(userPhone, '⏳ Got your location! Processing your report...');
        processReport(userPhone, pendingReports[userPhone]).catch(console.error);
      } else {
        await sendReply(userPhone,
          '📍 Location received! Now send a *photo* of the civic issue with a short description.'
        );
      }
      return;
    }

    // Handle image message
    if (parseInt(NumMedia) > 0 && MediaUrl0) {
      pendingReports[userPhone].imageUrl = MediaUrl0;
      if (message) pendingReports[userPhone].message = message;
      console.log(`📸 Got image for ${userPhone}`);

      if (pendingReports[userPhone].lat && pendingReports[userPhone].lng) {
        // Reply immediately then process
        await sendReply(userPhone, '⏳ Got your photo! Processing your report...');
        processReport(userPhone, pendingReports[userPhone]).catch(console.error);
      } else {
        await sendReply(userPhone,
          '📸 Photo received! Now please share your *live location* on WhatsApp so we can pin it on the map.'
        );
      }
      return;
    }

    // Handle text only
    if (message && parseInt(NumMedia) === 0) {
      if (pendingReports[userPhone].imageUrl && pendingReports[userPhone].lat) {
        pendingReports[userPhone].message = message;
        await processReport(userPhone, pendingReports[userPhone]);
      } else {
        pendingReports[userPhone].message = message;
        await sendReply(userPhone,
          `👋 Welcome to *FixMyCity*!\n\nTo report a civic issue:\n1️⃣ Send a *photo* of the problem\n2️⃣ Share your *live location*\n3️⃣ Add a short description (e.g. "pothole", "garbage")\n\nYour report will appear on our public map! 🗺️`
        );
      }
      return;
    }

  } catch (err) {
    console.error('Webhook error:', err);
  }
});

// Resolution webhook
router.post('/resolution', async (req, res) => {
  res.set('Content-Type', 'text/xml');
  res.send('<Response></Response>');

  try {
    const { From, Body } = req.body;
    const userPhone = From.replace('whatsapp:', '');
    const reply = Body?.trim().toUpperCase();

    if (reply === 'NO') {
      const { data: issues } = await supabase
        .from('issues')
        .select('*')
        .eq('status', 'resolved')
        .contains('reporter_phones', [userPhone])
        .order('resolved_at', { ascending: false })
        .limit(1);

      if (issues?.length > 0) {
        await supabase
          .from('issues')
          .update({
            status: 'reported',
            resolved_at: null,
            last_updated: new Date().toISOString(),
          })
          .eq('id', issues[0].id);

        await sendReply(userPhone,
          '⚠️ Thank you. The issue has been reopened and escalated.'
        );
      }
    } else if (reply === 'YES') {
      await sendReply(userPhone, '✅ Great! Glad the issue was resolved! 🙌');
    }
  } catch (err) {
    console.error('Resolution error:', err);
  }
});

module.exports = router;