const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send WhatsApp resolution confirmation to all reporters
async function sendResolutionCheck(phones, location) {
  for (const phone of phones) {
    try {
      await twilioClient.messages.create({
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${phone}`,
        body: `✅ The civic issue at *${location}* has been marked as resolved by authorities.\n\nWas it actually fixed? Reply *YES* or *NO*`
      });
    } catch (err) {
      console.error(`Failed to message ${phone}:`, err.message);
    }
  }
}

// GET all issues for admin (all statuses)
router.get('/issues', async (req, res) => {
  try {
    const { status, ward, type } = req.query;

    let query = supabase
      .from('issues')
      .select('*')
      .order('priority_score', { ascending: false });

    if (status) query = query.eq('status', status);
    if (ward) query = query.eq('ward', ward);
    if (type) query = query.eq('type', type);

    const { data, error } = await query;
    if (error) throw error;

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH mark issue status
router.patch('/issues/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const updates = {
      status,
      last_updated: new Date().toISOString(),
    };

    if (status === 'resolved') {
      updates.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Send WhatsApp confirmation to reporters if resolved
    if (status === 'resolved' && data.reporter_phones?.length > 0) {
      const location = `${data.lat.toFixed(4)}, ${data.lng.toFixed(4)}`;
      sendResolutionCheck(data.reporter_phones, location);
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const { data: all } = await supabase
      .from('issues')
      .select('status, severity, report_count');

    const total = all?.length || 0;
    const resolved = all?.filter(i => i.status === 'resolved').length || 0;
    const critical = all?.filter(i => i.severity >= 4).length || 0;
    const pending = all?.filter(i => i.status === 'reported').length || 0;

    res.json({
      success: true,
      data: { total, resolved, critical, pending }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;