const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Hardcoded Mysuru wards for hackathon demo
const MYSURU_WARDS = [
  'Jayalakshmipuram',
  'Vijayanagar',
  'Kuvempunagar',
  'Hebbal',
  'Nazarbad',
  'Lakshmipuram',
  'Chamaraja',
  'Krishnaraja',
  'Devraj',
  'Shaktinagar',
];

// Calculate neglect score per ward
function calcNeglectScore(issues) {
  if (!issues.length) return 0;
  const avgDays = issues.reduce((sum, i) => {
    const days = Math.floor(
      (Date.now() - new Date(i.created_at)) / 86400000
    );
    return sum + days;
  }, 0) / issues.length;

  const avgSeverity = issues.reduce((sum, i) =>
    sum + i.severity, 0) / issues.length;

  const raw = avgDays * issues.length * avgSeverity;
  // Normalize to 0-100
  return Math.min(100, Math.round(raw / 10));
}

// GET /api/neglect — neglect scores per ward
router.get('/', async (req, res) => {
  try {
    const { data: issues, error } = await supabase
      .from('issues')
      .select('*')
      .neq('status', 'resolved');

    if (error) throw error;

    const wardScores = MYSURU_WARDS.map(ward => {
      const wardIssues = issues.filter(i => i.ward === ward);
      const score = calcNeglectScore(wardIssues);
      const worstType = wardIssues.sort((a, b) =>
        b.severity - a.severity)[0]?.type || 'none';

      return {
        ward,
        neglect_score: score,
        issue_count: wardIssues.length,
        worst_type: worstType,
        authority: 'Mysuru City Corporation',
      };
    });

    // Sort by neglect score descending
    wardScores.sort((a, b) => b.neglect_score - a.neglect_score);

    res.json({ success: true, data: wardScores });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;