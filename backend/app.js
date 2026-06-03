const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { Low, JSONFile } = require('lowdb');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// LowDB setup
const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter);

async function initDB() {
  await db.read();
  db.data = db.data || { users: [], medicines: [], intakeLogs: [] };
  await db.write();
}

initDB();

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Auth routes
app.post('/api/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  await db.read();
  const exists = db.data.users.find(u => u.email === email);
  if (exists) return res.status(400).json({ error: 'User may already exist' });
  const hashed = bcrypt.hashSync(password, 10);
  const newUser = { id: Date.now(), email, password: hashed, name };
  db.data.users.push(newUser);
  await db.write();
  const token = jwt.sign({ id: newUser.id, email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: newUser.id, email, name } });
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  await db.read();
  const user = db.data.users.find(u => u.email === email);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

app.post('/api/forgot-password', (req, res) => {
  res.json({ message: 'Password reset link (mock) sent to email if it exists.' });
});

// Medicine CRUD (protected)
app.get('/api/medicines', authenticateToken, async (req, res) => {
  await db.read();
  const meds = db.data.medicines.filter(m => m.user_id === req.user.id);
  res.json(meds);
});

app.post('/api/medicines', authenticateToken, async (req, res) => {
  const { name, category, dosage, frequency, start_date, end_date, notes, reminder_time, repeat, custom_days, snooze_minutes } = req.body;
  await db.read();
  const newMed = {
    id: Date.now(),
    user_id: req.user.id,
    name,
    category,
    dosage,
    frequency,
    start_date,
    end_date,
    notes,
    reminder_time: reminder_time || null, // e.g., "08:00"
    repeat: repeat || 'daily', // daily, weekly, custom
    custom_days: custom_days || [], // array of weekday numbers 0-6 for custom
    snooze_minutes: snooze_minutes || 5
  };
  db.data.medicines.push(newMed);
  await db.write();
  res.json({ id: newMed.id });
});

app.put('/api/medicines/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, category, dosage, frequency, start_date, end_date, notes, reminder_time, repeat, custom_days, snooze_minutes } = req.body;
  await db.read();
  const med = db.data.medicines.find(m => m.id === Number(id) && m.user_id === req.user.id);
  if (!med) return res.status(404).json({ error: 'Medicine not found' });
  Object.assign(med, { name, category, dosage, frequency, start_date, end_date, notes, reminder_time, repeat, custom_days, snooze_minutes });
  await db.write();
  res.json({ changes: 1 });
});

app.delete('/api/medicines/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  await db.read();
  const index = db.data.medicines.findIndex(m => m.id === Number(id) && m.user_id === req.user.id);
  if (index === -1) return res.status(404).json({ error: 'Medicine not found' });
  db.data.medicines.splice(index, 1);
  await db.write();
  res.json({ changes: 1 });
});

// Intake logging (protected)
app.post('/api/intake', authenticateToken, async (req, res) => {
  const { medicine_id, status } = req.body; // status: 'taken', 'skipped', 'remind_later'
  if (!medicine_id || !status) return res.status(400).json({ error: 'medicine_id and status required' });
  await db.read();
  const med = db.data.medicines.find(m => m.id === Number(medicine_id) && m.user_id === req.user.id);
  if (!med) return res.status(404).json({ error: 'Medicine not found' });
  const log = {
    id: Date.now(),
    user_id: req.user.id,
    medicine_id: med.id,
    timestamp: new Date().toISOString(),
    status
  };
  db.data.intakeLogs.push(log);
  await db.write();
  res.json({ logId: log.id });
});

app.get('/api/intake/history', authenticateToken, async (req, res) => {
  await db.read();
  const logs = db.data.intakeLogs.filter(l => l.user_id === req.user.id);
  res.json(logs);
});

// Reminder and intake tracking

// Initialize additional tables
db.run(`CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  medicine_id INTEGER NOT NULL,
  reminder_time TEXT NOT NULL,
  recurrence TEXT NOT NULL, -- daily, weekly, custom
  snooze_until TEXT,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
)`);

db.run(`CREATE TABLE IF NOT EXISTS intake_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reminder_id INTEGER NOT NULL,
  status TEXT NOT NULL, -- taken, skipped, snoozed
  timestamp TEXT NOT NULL,
  FOREIGN KEY(reminder_id) REFERENCES reminders(id) ON DELETE CASCADE
)`);

// Create a reminder
app.post('/api/reminders', authenticateToken, (req, res) => {
  const { medicine_id, reminder_time, recurrence } = req.body;
  const stmt = db.prepare('INSERT INTO reminders (user_id, medicine_id, reminder_time, recurrence) VALUES (?, ?, ?, ?)');
  stmt.run(req.user.id, medicine_id, reminder_time, recurrence, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    res.json({ id: this.lastID });
  });
});

// Get due reminders (within next minute)
app.get('/api/reminders/due', authenticateToken, (req, res) => {
  const now = new Date();
  const next = new Date(now.getTime() + 60000); // 1 minute ahead
  const nowStr = now.toISOString();
  const nextStr = next.toISOString();
  db.all(`SELECT r.id, r.medicine_id, r.reminder_time, r.recurrence, m.name, m.dosage FROM reminders r
    JOIN medicines m ON r.medicine_id = m.id
    WHERE r.user_id = ? AND r.reminder_time BETWEEN ? AND ?`,
    [req.user.id, nowStr, nextStr], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
});

// Record intake response
app.post('/api/intake/:reminderId', authenticateToken, (req, res) => {
  const { reminderId } = req.params;
  const { status } = req.body; // taken, skipped, snoozed
  const stmt = db.prepare('INSERT INTO intake_logs (reminder_id, status, timestamp) VALUES (?, ?, ?)');
  stmt.run(reminderId, status, new Date().toISOString(), function (err) {
    if (err) return res.status(400).json({ error: err.message });
    // If snoozed, update snooze_until (example: add 10 minutes)
    if (status === "snoozed") {
      const snoozeUntil = new Date(Date.now() + 10 * 60000).toISOString();
      db.run('UPDATE reminders SET snooze_until = ? WHERE id = ?', [snoozeUntil, reminderId]);
    }
    res.json({ id: this.lastID });
  });
});

// Update recurrence after snooze or missed handling could be added later

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
