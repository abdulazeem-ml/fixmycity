const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const axios = require('axios');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Multer — store in memory
const upload = multer({ storage: multer.memoryStorage() });

// Haversine distance in meters
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

// ML validation via Google Vision API
async function validateImage(imageBuffer) {
  try {
    const base64 = imageBuffer.toString('base64');
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_VISION_API_KEY}`,
      {
        requests: [{
          image: { content: base64 },
          features: [{ type: 'LABEL_DETECTION', maxResults: 10 }]
        }]
      }
    );

    const labels = response.data.responses[0].labelAnnotations
      .map(l => l.description.toLowerCase());

    const civicKeywords = [
      'road', 'asphalt', 'pothole', 'rubble', 'waste',
      'garbage', 'flood', 'water', 'debris', 'infrastructure',
      'street', 'pavement', 'drain', 'construction', 'damage'
    ];

    const matched = labels.some(label =>
      civicKeywords.some(keyword => label.includes(keyword))
    );

    return matched;
  } catch (err) {
    console.error('Vision API error:', err.message);
    // If API fails during hackathon — allow through
    return true;
  }
}

// Upload image to Supabase Storage
async function uploadImage(buffer, filename) {
  const { data, error } = await supabase.storage
    .from('issue-images')
    .upload(`issues/${filename}`, buffer, {
      contentType: 'image/jpeg',
      upsert: false
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('issue-images')
    .getPublicUrl(`issues/${filename}`);

  return urlData.publicUrl;
}

// Calculate priority score
function calcPriority(reportCount, severity, daysUnresolved) {
  return (reportCount * 0.4) + (severity * 0.3) +
    (daysUnresolved * 0.2) + (1 * 0.1);
}

// POST /api/report — web form submission
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { type, description, lat, lng } = req.body;
    const imageBuffer = req.file?.buffer;

    if (!imageBuffer || !type || !lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // ML validation
    const isValid = await validateImage(imageBuffer);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Could not identify a civic issue in your photo. Please retake.'
      });
    }

    // Upload image
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
    const imageUrl = await uploadImage(imageBuffer, filename);

    // Check for existing issue within 30 meters
    const { data: allIssues } = await supabase
      .from('issues')
      .select('*')
      .neq('status', 'resolved');

    const nearby = allIssues?.find(issue => {
      const dist = getDistance(
        parseFloat(lat), parseFloat(lng),
        issue.lat, issue.lng
      );
      return dist <= 30 && issue.type === type;
    });

    if (nearby) {
      // Update existing issue
      const newCount = nearby.report_count + 1;
      const days = Math.floor(
        (Date.now() - new Date(nearby.created_at)) / 86400000
      );
      const priority = calcPriority(newCount, nearby.severity, days);

      const { data, error } = await supabase
        .from('issues')
        .update({
          report_count: newCount,
          image_urls: [...(nearby.image_urls || []), imageUrl],
          last_updated: new Date().toISOString(),
          priority_score: priority,
        })
        .eq('id', nearby.id)
        .select()
        .single();

      if (error) throw error;
      return res.json({
        success: true,
        message: `Report added. ${newCount} people have reported this issue.`,
        data,
        isNew: false
      });
    }

    // Create new issue
    const { data, error } = await supabase
      .from('issues')
      .insert({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        type,
        image_urls: [imageUrl],
        report_count: 1,
        severity: 1,
        status: 'reported',
        authority: 'Mysuru City Corporation',
        ward: 'General',
        priority_score: calcPriority(1, 1, 0),
      })
      .select()
      .single();

    if (error) throw error;
    res.json({
      success: true,
      message: 'Report submitted successfully.',
      data,
      isNew: true
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;