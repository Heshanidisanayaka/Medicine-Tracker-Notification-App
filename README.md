# Medicine Tracker & Notification App

A cross‑platform mobile app for managing medicines, reminders, and health data.

## Features Implemented
- Prescription management (upload, view, download).
- Health dashboard with charts (daily/weekly/monthly reports).
- Caregiver / family monitoring.
- Emergency contact module.
- Inventory management and low‑stock alerts.
- Doctor appointment management.
- AI medicine assistant (OpenAI `gpt-4o-mini`).

## Advanced Features (User‑selected preferences)
1. **Medicine Refill Reminder** – Notify via **email** when stock is low.
2. **Barcode / QR Code Scanner** – Uses **OpenFDA** public API for lookup.
3. **Expiry Date Tracker** – Alerts via email.
4. **Voice Assistant** – Supports **English + Sinhala** using the Web Speech API.
5. **Smart Calendar View** – Interactive schedule built with **FullCalendar**.

## Tech Stack
- **Frontend:** React Native (or Flutter) – UI components, Chart.js, FullCalendar.
- **Backend:** Node.js + Express, data stored in `lowdb` JSON file.
- **Auth:** Firebase Auth or JWT.
- **Notifications:** In‑app toast, email (via nodemailer), optional SMS via Twilio.
- **OCR:** Tesseract (fallback) / Google Vision API (future).

## Getting Started
```bash
# Clone the repo (already done)
npm install           # install backend dependencies
npm run dev           # start the server (http://localhost:3000)
```

> **Note:** The repository now includes the user’s preference selections recorded in `implementation_plan.md`.
