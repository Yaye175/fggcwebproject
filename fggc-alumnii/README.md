# FGGC Alumni Association Website

This project is a complete full-stack web application designed for the FGGC Alumni Association, built using vanilla HTML/CSS/JS for the frontend and Node.js/Express/MySQL for the backend.

## 🌟 Features Implemented

- **Authentication System:** Secure JWT-based login and registration with hashed (bcrypt) passwords.
- **User Dashboard:** Dedicated portal for alumni members.
- **Admin & PRO Panel:** Specialized dashboard for tracking payments, publishing announcements, and member management.
- **Dynamic Content:** API-driven news, minutes, stories, and event pages.
- **Finance Tracking:** Ability to track alumni dues on a monthly/yearly basis.
- **Gallery Management:** Upload and view event pictures dynamically.

## 📂 Project Structure

```text
fggc-alumni/
├── backend/
│   ├── src/
│   │   ├── index.js             # Entry point (Express server setup)
│   │   ├── db.js                # MySQL database connection pool
│   │   ├── middleware/          # Security & Auth middlewares
│   │   ├── routes/              # Modularized API endpoints (auth, admin, events, etc.)
│   │   └── uploads/             # Static storage for gallery images
│   ├── .env.example
│   ├── package.json
│   ├── migrate-schema.js        # DB Helper scripts
│   └── schema.sql               # Database architecture definitions
└── frontend/
    ├── css/styles.css           # Vanilla CSS styles (No Frameworks)
    ├── js/                      # Frontend Logic
    │   ├── api.js               # Centralized fetch wrapper for backend calls
    │   ├── auth.js              # Token and login/signup flows
    │   ├── dashboard.js         # Standard member dashboard logic
    │   ├── admin-dashboard.js   # Admin-specific privileges
    │   └── *.html               # Main structural files
```

## 🚀 Running Locally

1. **Database Setup**
   - Start your MySQL server.
   - Run the code inside `backend/schema.sql` to generate the `fggc_alumnii` database or run `node backend/migrate-schema.js` if configured.

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update .env to include DB variables and your JWT Secret.
   npm run dev
   ```

3. **Frontend Setup**
   - Serve the `/frontend/` folder organically using a tool like VS Code Live Server, or launch it directly in a browser.

## 🎨 Colour-Contrast Check

Every PR that touches the frontend runs an automated WCAG AA contrast check
(`.github/workflows/contrast.yml`). It opens every page in light and dark theme,
logged out and logged in, and fails if a change makes any text harder to read.

Run it locally from the repo root:

```bash
npm install --ignore-scripts
npx playwright install chromium   # first time only
npm run check:contrast
```

Existing failures are listed in `scripts/contrast-baseline.json`; only **new**
ones fail the check. After fixing some, shrink the list so they can't come back:

```bash
npm run check:contrast -- --update-baseline
```

Only add entries to the baseline on purpose — never to silence a real regression.

## 🔐 Built-in Security (Server Side)
- **Helmet:** Sets varied HTTP headers.
- **Bcrypt:** Hashes passwords to avoid plaintext leaks.
- **JWT:** Handles session integrity instead of raw server-side sessions.
- **Prepared Statements:** The `mysql2` driver ensures parameterized query processing to deter SQL injections.
