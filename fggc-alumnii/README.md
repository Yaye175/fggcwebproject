# FGGC Alumni Association Website

This project is a complete full-stack skeleton for the FGGC Alumni Association website, built using vanilla HTML/CSS/JS for the frontend and Node.js/Express/MySQL for the backend.

## 📂 Project Structure

```
fggc-alumni/
├── backend/
│   ├── src/
│   │   ├── index.js             # Entry point
│   │   ├── db.js                # MySQL database connection
│   │   ├── middleware/          # Auth & Admin middlewares
│   │   ├── routes/              # API endpoints
│   │   └── uploads/             # Static files like gallery images
│   ├── .env.example
│   ├── package.json
│   └── schema.sql               # Database structure
└── frontend/
    ├── css/styles.css           # Vanilla CSS styles (No Frameworks)
    ├── js/                      # Frontend Logic
    │   ├── api.js               # Helper for API requests
    │   ├── auth.js              # Login/Signup logic
    │   ├── dashboard.js         # User dashboard logic
    │   └── admin.js             # Admin specific logic
    └── *.html                   # Application Pages
```

## 🚀 Running Locally

1. **Database Setup**
   - Install MySQL.
   - Run the SQL commands in `backend/schema.sql` to create the structure.

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MySQL credentials
   npm run dev
   ```

3. **Frontend Setup**
   - The frontend uses vanilla JS and can be served using any static web server (e.g., Live Server extension in VS Code).
   - Alternatively, open `frontend/index.html` directly in your browser. Note: API requests might require running it via an IP or localhost (e.g. via `npx serve frontend`).

## 🌍 Deployment Instructions

### Render (Free Tier)
1. Push the `backend` folder to a GitHub repository.
2. In Render Dashboard, click **New > Web Service**.
3. Connect the repo and select the `backend` folder.
4. Set Build Command: `npm install`
5. Set Start Command: `npm start`
6. Add your `.env` variables in Render's Environment settings.
7. Note: For MySQL, you will need a managed database provider like Aiven, PlanetScale, or Railway since Render does not have a native free-tier MySQL. Update the `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` accordingly.

For the frontend:
1. In Render Dashboard, click **New > Static Site**.
2. Connect the repo and select the `frontend` folder.
3. Once deployed, open `frontend/js/api.js` and change `http://localhost:5000` to the new Render Web Service URL.

### DigitalOcean/VPS (using PM2)
If deploying to a Node.js VPS (Ubuntu):
```bash
# 1. SSH into the server and clone the repo
# 2. Install Node.js, MySQL, and Nginx
sudo apt update
sudo apt install nodejs npm mysql-server -y

# 3. Setup the database
mysql -u root -p < backend/schema.sql

# 4. Install PM2
sudo npm i -g pm2

# 5. Start the backend app
cd backend
npm install
pm2 start src/index.js --name "fggcalumni"
pm2 save
pm2 startup

# 6. For Frontend, configure Nginx to serve the static files in the /frontend directory and proxy /api requests to localhost:5000.
```

## 🔐 Security Features Implemented
- **bcrypt**: Used to securely hash and compare user passwords.
- **JWT (JSON Web Tokens)**: Secure token generation and validation for protecting dashboard and API routes.
- **helmet**: Secure Express apps by setting various HTTP headers.
- **cors**: Controls cross-origin resource sharing to keep API secure.
- **Admin Middleware**: Enforces that only users with `is_admin = 1` in the database can access admin financial panels.
