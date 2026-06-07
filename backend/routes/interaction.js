// backend/routes/interaction.js
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { LowSync, JSONFileSync } = require('lowdb');
const dbFile = path.join(__dirname, '..', 'db.json');
const adapter = new JSONFileSync(dbFile);
const db = new LowSync(adapter);
await db.read();

// Load static interaction data (demo). In production replace with a proper DB/API.
const interactionsFile = path.join(__dirname, '..', 'data', 'interactions.json');
let interactions = [];
if (fs.existsSync(interactionsFile)) {
  try {
    interactions = JSON.parse(fs.readFileSync(interactionsFile, 'utf-8'));
  } catch (e) {
    console.error('Failed to parse interactions data:', e);
    interactions = [];
  }
}

/**
 * GET /api/medicines/interactions
 * Returns a list of interaction warnings for the authenticated user's medicines.
 */
router.get('/', async (req, res) => {
  // Ensure db is available via global variable (same as other routes)
  await db.read();
  const userMeds = db.data.medicines.filter(m => m.user_id === req.user.id);
  const warnings = [];

  // Compare each unordered pair of medicines
  for (let i = 0; i < userMeds.length; i++) {
    for (let j = i + 1; j < userMeds.length; j++) {
      const medA = userMeds[i];
      const medB = userMeds[j];
      // Find interaction entry where drugA/drugB match (case‑insensitive)
      const entry = interactions.find(it => {
        const a = it.drugA.toLowerCase();
        const b = it.drugB.toLowerCase();
        return (
          (a === medA.name.toLowerCase() && b === medB.name.toLowerCase()) ||
          (a === medB.name.toLowerCase() && b === medA.name.toLowerCase())
        );
      });
      if (entry) {
        warnings.push({
          medicines: [medA.name, medB.name],
          warning: entry.warning
        });
      }
    }
  }

  res.json(warnings);
});

module.exports = router;
