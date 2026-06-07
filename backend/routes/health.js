// backend/routes/health.js
const path = require('path');
const { LowSync, JSONFileSync } = require('lowdb');
const dbFile = path.join(__dirname, '..', 'db.json');
const adapter = new JSONFileSync(dbFile);
const db = new LowSync(adapter);
await db.read();
const router = express.Router();

/**
 * POST /api/health-records
 * Add a new health record (type, value, unit, recorded_at)
 */
router.post('/', async (req, res) => {
  const { type, value, unit, recorded_at } = req.body;
  if (!type || value === undefined) {
    return res.status(400).json({ error: 'type and value required' });
  }
  await db.read();
  const newRecord = {
    id: Date.now(),
    user_id: req.user.id,
    type,
    value,
    unit: unit || '',
    recorded_at: recorded_at || new Date().toISOString(),
  };
  db.data.health_records.push(newRecord);
  await db.write();
  res.json({ id: newRecord.id });
});

/**
 * GET /api/health-records
 * Optional filters: type, from (ISO date), to (ISO date)
 */
router.get('/', async (req, res) => {
  const { type, from, to } = req.query;
  await db.read();
  let records = db.data.health_records.filter(r => r.user_id === req.user.id);
  if (type) records = records.filter(r => r.type === type);
  if (from) records = records.filter(r => new Date(r.recorded_at) >= new Date(from));
  if (to) records = records.filter(r => new Date(r.recorded_at) <= new Date(to));
  res.json(records);
});

/**
 * GET /api/health-records/report
 * Query params: type (required), range=weekly|monthly|yearly (default monthly)
 * Returns avg/min/max for the selected period.
 */
router.get('/report', async (req, res) => {
  const { type, range = 'monthly' } = req.query;
  if (!type) return res.status(400).json({ error: 'type required' });

  const now = new Date();
  let start;
  if (range === 'weekly') start = new Date(now - 7 * 24 * 60 * 60 * 1000);
  else if (range === 'yearly') start = new Date(now.getFullYear(), 0, 1);
  else start = new Date(now.getFullYear(), now.getMonth(), 1); // monthly

  await db.read();
  const filtered = db.data.health_records.filter(r =>
    r.user_id === req.user.id &&
    r.type === type &&
    new Date(r.recorded_at) >= start
  );

  if (!filtered.length) return res.json({ message: 'No records in range' });

  const values = filtered.map(r => Number(r.value)).filter(v => !isNaN(v));
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  res.json({ type, range, count: values.length, avg, min, max });
});

module.exports = router;
