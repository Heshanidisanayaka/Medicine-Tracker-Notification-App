// backend/routes/patients.js
const express = require('express');
const router = express.Router();
const path = require('path');
const { LowSync, JSONFileSync } = require('lowdb');
const dbFile = path.join(__dirname, '..', 'db.json');
const adapter = new JSONFileSync(dbFile);
const db = new LowSync(adapter);
await db.read();

// Ensure patients collection exists
if (!db.data.patients) db.data.patients = [];

// Create a new patient (family member)
router.post('/', async (req, res) => {
  const { name, dateOfBirth, type } = req.body;
  if (!name || !dateOfBirth) return res.status(400).json({ error: 'Name and dateOfBirth required' });
  const newPatient = {
    id: Date.now(),
    primaryUserId: req.user.id,
    name,
    dateOfBirth,
    type: type || 'adult',
  };
  db.data.patients.push(newPatient);
  await db.write();
  res.json({ id: newPatient.id });
});

// List patients belonging to the primary user
router.get('/', async (req, res) => {
  await db.read();
  const patients = db.data.patients.filter(p => p.primaryUserId === req.user.id);
  res.json(patients);
});

// Update patient info
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, dateOfBirth, type } = req.body;
  await db.read();
  const patient = db.data.patients.find(p => p.id === Number(id) && p.primaryUserId === req.user.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  if (name) patient.name = name;
  if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
  if (type) patient.type = type;
  await db.write();
  res.json({ updated: true });
});

// Delete patient
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await db.read();
  const index = db.data.patients.findIndex(p => p.id === Number(id) && p.primaryUserId === req.user.id);
  if (index === -1) return res.status(404).json({ error: 'Patient not found' });
  db.data.patients.splice(index, 1);
  await db.write();
  res.json({ deleted: true });
});

module.exports = router;
