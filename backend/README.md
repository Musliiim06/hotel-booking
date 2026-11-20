# Hotel Reservation System - Backend (Refactored)

Modular, layered architecture for the Hotel Reservation backend with Node.js, Express, PostgreSQL, and Stripe.

## Architecture Overview

```text
src/
├── config/             # Database pool and external API clients
│   ├── db.js
│   └── stripe.js
├── controllers/        # Request handling and HTTP responses
│   ├── booking.controller.js
│   ├── room.controller.js
│   └── webhook.controller.js
├── middlewares/        # Express middlewares (error handling, auth, captcha)
│   ├── error.middleware.js
│   └── recaptcha.middleware.js
├── routes/             # Route declarations
│   ├── booking.routes.js
│   ├── index.js
│   ├── room.routes.js
│   └── webhook.routes.js
├── services/           # Core business logic and database queries
│   ├── booking.service.js
│   ├── room.service.js
│   ├── stripe.service.js
│   └── user.service.js
├── app.js              # Express app setup and middleware pipeline
└── server.js           # Server entry point & graceful shutdown
```

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup environment variables:
   ```bash
   cp .env.example .env
   ```

3. Run in development:
   ```bash
   npm run dev
   ```

4. Run in production:
   ```bash
   npm start
   ```
