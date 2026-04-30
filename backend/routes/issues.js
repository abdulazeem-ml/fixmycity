const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET all visible issues (12+ reports)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .gte('report_count', 12)
      .neq('status', 'resolved')
      .order('priority_score', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single issue by id
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH update issue status (admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
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
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;