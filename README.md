# Medicine Tracker & Notification App

A full‑stack web application for managing personal medication schedules, tracking stock, expiry dates, health records, location‑based reminders, and checking for harmful drug interactions.

## Features
- **Medicine CRUD** – add, edit, delete medicines with dosage, frequency, stock, low‑stock threshold, and expiry date.
- **Intake logging** – record when a dose is taken, skipped or postponed.
- **Low‑stock & expiry alerts** – email notifications when stock falls below the threshold or a medicine is about to expire.
- **Barcode / QR lookup** – fetch medicine details from OpenFDA using a scanned code.
- **Location‑based reminders** – define home/work locations; receive reminders when entering those geofences.
- **Health‑record management** – store BP, blood sugar, weight, heart‑rate records and generate summary reports.
- **Medicine interaction checker** – warns the user about known dangerous drug combinations.
- **Authentication** – JWT‑based login/registration.

## Tech Stack
- **Backend** – Node.js, Express, lowdb (JSON file DB), node‑cron, node‑fetch.
- **Frontend** – HTML, vanilla CSS, JavaScript (you can integrate any UI framework you prefer).
- **Deployment** – works locally with `npm run dev`; push to any Node‑compatible host.

## Getting Started
1. **Clone the repo**
   ```bash
   git clone https://github.com/Heshanidisanayaka/Medicine-Tracker-Notification-App.git
   cd Medicine-Tracker-Notification-App
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Run the development server**
   ```bash
   npm run dev   # (or `node backend/app.js` if no script defined)
   ```
   The server will start on `http://localhost:3000`.

## API Endpoints (selected)
- `POST /api/register` – register a new user.
- `POST /api/login` – obtain a JWT token.
- `GET /api/medicines` – list a user’s medicines.
- `POST /api/medicines` – create a medicine (supports `stock`, `lowThreshold`, `expiry_date`).
- `GET /api/medicines/low-stock` – medicines low on stock.
- `GET /api/medicines/expiring` – medicines expiring within 30 days.
- `GET /api/medicines/lookup/:code` – OpenFDA lookup by barcode/QR.
- `GET /api/medicines/interactions` – returns interaction warnings for the user’s current medicines.
- `POST /api/reminder-locations` – add a geofence location.
- `GET /api/reminder-locations` – list saved locations.
- `GET /api/health-records` – list health records (filterable).
- `POST /api/health-records` – add a health record.
- `GET /api/health-records/report` – summary (avg/min/max) for a period.

## Configuration
- Set `JWT_SECRET` in a `.env` file or rely on the default.
- Email notifications use the built‑in `nodemailer` configuration (customise in `backend/notification.js`).

## Contributing
Feel free to open issues or submit pull requests. Follow the existing code style and update the documentation as needed.

---
*This project is a personal learning demo; for production use, consider switching to a proper database, secure credential storage, and robust authentication.*
