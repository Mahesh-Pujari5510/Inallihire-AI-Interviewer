# IntelliHire AI
### AI-Powered Interview Preparation and Career Assistance Platform
**VTU Project 2025-26 | Basav Engineering School of Technology, Zalki**

---

## 👥 Team
| Name | USN |
|---|---|
| Mahesh | 2VL23CS009 |
| Fayaz | 2VL23CS007 |
| Abhishek | 2VL23CC001 |
| Yaseen | 2VL23CS011 |

**Guide:** Prof. Irfan Bagawan

---

## 🗂️ Project Files
```
IntelliHireAI.jsx        ← Full React frontend (demo artifact)
backend/
  server.js              ← Express API server
  package.json           ← Backend dependencies
  .env.example           ← Environment variables template
README.md                ← This file
```

---

## 🚀 How to Run

### Step 1 — Set up the Backend

```bash
# Go into backend folder
cd backend

# Install dependencies
npm install

# Create your .env file
cp .env.example .env
# Then open .env and fill in your GEMINI_API_KEY

# Start the server
npm run dev
```

Backend runs at: `http://localhost:5000`

---

### Step 2 — Set up the Frontend (React)

```bash
# Go back to root
cd ..

# Create a new React app
npx create-react-app intellihire-frontend
cd intellihire-frontend

# Install dependencies
npm install lucide-react recharts axios

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configure `tailwind.config.js`:
```js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

Add to `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Copy `IntelliHireAI.jsx` → `src/App.jsx`

```bash
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🔐 Authentication

There are no demo credentials in the application. Register a real account through the backend and complete onboarding. JWT sessions are stored in an HTTP-only cookie; all progress queries are scoped by the authenticated user ID.

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Frontend | React.js + Tailwind CSS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT (JSON Web Tokens) |
| AI Integration | Google Gemini API |
| Charts | Recharts |
| Icons | Lucide React |

---

## 📦 Key Features

1. **User Authentication** — Secure register/login with JWT
2. **Mock Interview** — AI generates questions, evaluates answers, gives scores
3. **Resume Analyzer** — ATS score, strengths, improvements, keyword detection
4. **Performance Analytics** — Score charts, skill radar, session history
5. **Admin Panel** — User management, platform statistics

---

## 🔗 API Endpoints

### Auth
- `POST /api/auth/register` — Create account
- `POST /api/auth/login` — Login
- `GET  /api/auth/me` — Get current user

### Interview
- `POST /api/interview/generate` — Generate AI questions
- `POST /api/interview/evaluate` — Evaluate an answer
- `POST /api/interview/save` — Save session
- `GET  /api/interview/history` — Get history

### Resume
- `POST /api/resume/analyze` — Analyze resume
- `GET  /api/resume/history` — Get past analyses

### Analytics
- `GET /api/analytics` — Get all stats
- `GET /api/dashboard` — Unified user-scoped dashboard aggregate

### Profile and privacy
- `PUT /api/profile` — Update name, target role, experience, graduation year, college, skills, goal, and timezone
- `GET /api/users/export` — Export user-owned records without raw video
- `DELETE /api/users/me` — Delete the account and associated progress

### Practice, video, and companies
- `POST /api/practice/sessions` — Upsert a timezone-aware daily plan
- `POST /api/practice/answers` — Save an answer, XP, accuracy, review state, and streak progress
- `POST /api/video-interviews` — Save consented transcript, speech metrics, and report; raw video is never stored
- `GET /api/companies/saved` — List the authenticated user&apos;s saved companies
- `POST /api/companies/saved` — Save a company
- `DELETE /api/companies/saved/:companyId` — Soft-delete a saved company
- `PUT /api/companies/:companyId/progress` — Save company task/readiness progress
- `POST /api/coach` — Generate coaching from summarized user-owned metrics only

## 🗃️ Data model

MongoDB collections are represented by Mongoose models in `server.js`:

`User`, `Interview`, `Resume`, `VideoInterview`, `PracticeSession`, `PracticeAnswer`, `UserStreak`, `SavedCompany`, `CompanyProgress`, and `UserSkillMetric`.

Activity records include `user`, timestamps, completion/status fields, and deletion markers where applicable. No SQL migration is required; MongoDB creates collections on first write. Existing databases migrate safely because newly added fields are optional.

## ⚙️ Connected setup

1. Copy `files/.env.example` to `files/.env`.
2. Set a real `MONGO_URI`, a strong `JWT_SECRET`, and the server-only `GEMINI_API_KEY`.
3. Start MongoDB, then run `npm install` and `npm start` from `files/`.
4. Run `npm install` and `npm start` from `files/intellihire/`.
5. Set `REACT_APP_API_URL=http://localhost:5000` in the frontend environment when the API is not on the default URL.

The frontend keeps a local cache only for offline recovery. Backend records are the source of truth whenever the API is available.

### Admin
- `GET    /api/admin/users` — All users
- `GET    /api/admin/stats` — Platform stats
- `DELETE /api/admin/users/:id` — Remove user

---

*IntelliHire AI — Smart Interview Preparation for Campus Placements*
