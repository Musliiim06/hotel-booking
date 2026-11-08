# Hotel Booking & Reservation System 🏨

A robust hotel booking engine built with **Node.js**, **Express**, **PostgreSQL**, and **Stripe API**. 

The backend is engineered to handle concurrent bookings without overbooking (solving race conditions using pessimistic row-level locking) and provides secure payment processing with webhook verification.

---

## 🚀 Key Features

* **Concurrency Control & Zero Overbooking:**
  * Uses PostgreSQL transactions (`BEGIN` / `COMMIT` / `ROLLBACK`) and `SELECT ... FOR UPDATE SKIP LOCKED` to lock available rooms during booking creation, completely preventing race conditions under high concurrent traffic.
* **Smart Availability Search:**
  * Efficient date-range overlap calculation (`check_in < $2 AND check_out > $1`) filtered by active rooms and reservation status.
* **Secure Payment Processing:**
  * Integrates **Stripe Checkout** for payment sessions.
  * Asynchronous, reliable order confirmation via **Stripe Webhooks** with cryptographic signature verification (`stripe.webhooks.constructEvent`).
* **Relational Data Architecture:**
  * PostgreSQL schemas for Users, Rooms, and Bookings.
  * Parameterized SQL queries preventing SQL injections.

---

## 🛠 Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** PostgreSQL (`pg` connection pool)
* **Payments:** Stripe API (Checkout & Webhooks)
* **Configuration:** dotenv

---

## 📁 Project Structure

```text
hotel/
├── backend/
│   ├── .env.example       # Sample environment configuration
│   ├── db.js              # PostgreSQL pool setup
│   ├── index.js           # REST API endpoints & Stripe webhook
│   └── package.json       # Dependencies & scripts
└── frontend/              # Client application
```

---

## ⚙️ Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Musliiim06/hotel-booking.git
cd hotel/backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

| Variable | Description |
| :--- | :--- |
| `PORT` | Server port (default: `3000`) |
| `CLIENT_URL` | Frontend origin for CORS |
| `STRIPE_SECRET_KEY` | Stripe Secret API Key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook signing secret |
| `DB_USER` | PostgreSQL user |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_HOST` | Database host (e.g. `localhost`) |
| `DB_NAME` | Database name |
| `DB_PORT` | Database port (default: `5432`) |

### 4. Run the server
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

---

## 🔌 API Endpoints

* `GET /api/available-rooms?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` — Search free rooms for the given period.
* `POST /api/create-checkout-session` — Create a user, hold booking, and return a Stripe Checkout URL.
* `POST /webhook` — Receive and verify Stripe events (`checkout.session.completed`, etc.).

---

## 📄 License
ISC
