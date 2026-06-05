// backend/cronJobs.js
// Simple cron jobs for refill and expiry alerts (stub implementation)
// Uses node-cron. In a real app, configure email/SMS transports.

const cron = require('node-cron');
const path = require('path');
const { LowSync, JSONFileSync } = require('lowdb');

const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFileSync(dbFile);
const db = new LowSync(adapter);

db.read();
if (!db.data) db.data = { users: [], medicines: [], intakeLogs: [] };

// Helper to send alert (placeholder)
function sendAlert(userEmail, subject, message) {
  // TODO: integrate nodemailer or other service
  console.log(`Alert to ${userEmail}: ${subject} - ${message}`);
}

// Refill reminder – runs daily at 08:00
cron.schedule('0 8 * * *', () => {
  db.read();
  const meds = db.data.medicines || [];
  meds.forEach(med => {
    if (typeof med.stock === 'number' && typeof med.lowThreshold === 'number' && med.stock <= med.lowThreshold) {
      const user = db.data.users.find(u => u.id === med.user_id);
      if (user) {
        sendAlert(user.email, 'Medicine Refill Reminder', `Only ${med.stock} ${med.name} remaining. Refill recommended.`);
      }
    }
  });
});

// Expiry reminder – runs daily at 09:00
cron.schedule('0 9 * * *', () => {
  db.read();
  const now = new Date();
  const meds = db.data.medicines || [];
  meds.forEach(med => {
    if (med.expiry_date) {
      const expiry = new Date(med.expiry_date);
      const diffDays = Math.round((expiry - now) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 30) { // alert within 30 days
        const user = db.data.users.find(u => u.id === med.user_id);
        if (user) {
          sendAlert(user.email, 'Medicine Expiry Alert', `Your ${med.name} will expire in ${diffDays} days.`);
        }
      }
    }
  });
});

module.exports = { cron };
