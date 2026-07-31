# FitKit — Smart Fitness Tracker (MERN)

A full-stack fitness tracker with a **premium Vite + React** frontend and an **Express + MongoDB** backend.

## ✨ Features

- **Authentication** — secure register / login with JWT + bcrypt
- **Light / Dark theme** — light is default, switch anytime from Profile (or sidebar)
- **Dashboard** — calories consumed/burned, net calories, active minutes, daily goal ring
- **Charts** — 7-day calorie trends (area), macro split (donut), workout minutes (bars)
- **Meals & Nutrition** — *Meal Library*: save usual meals once, add to any day with one tap (or freeform with date picker); track calories, protein, carbs & fat
- **Exercise Library** — save exercises once, then log which ones you did on any day
- **Workouts** — sessions with duration & calories burned, auto-calc from kcal/min, burn-rate analytics
- **Profile** — height/weight/age/gender/activity → automatic **BMR, TDEE & daily calorie goal**
- **Premium UI** — Tailwind CSS, glass cards, gradients, fully responsive

## 🚀 How to Run

### Prerequisites
- Node.js (LTS)
- MongoDB Community Server (running on `localhost:27017`)

### Step 1 — Backend
```bash
cd backend
npm install        # first time only
npm start          # http://localhost:5000
```
You should see: `Server is running on port: 5000` and `Database connected`.

### Step 2 — Frontend
Open a new terminal:
```bash
cd frontend
npm install        # first time only
npm run dev        # http://localhost:5173
```

Open http://localhost:5173, create an account, and start tracking!

## 📁 Project Structure

```
backend/
  models/      user, meal, workout, exercise
  routes/      auth, meals, workouts, exercises, users
  middleware/  JWT auth guard
frontend/
  src/
    pages/       Login, Register, Dashboard, Meals, Workouts, Profile
    components/  Layout (sidebar), Modal, ProtectedRoute
    context/     AuthContext (JWT session)
    api/         axios client (auto-attaches token)
```

## 🔑 API Endpoints

| Method | Endpoint              | Description            |
| ------ | --------------------- | ---------------------- |
| POST   | `/auth/register`      | Create account         |
| POST   | `/auth/login`         | Sign in (returns JWT)  |
| GET    | `/auth/me`            | Current user           |
| PUT    | `/auth/profile`       | Update profile + goal  |
| GET    | `/meals/range?days=7` | Meals in date range    |
| POST   | `/meals/add`          | Add meal               |
| DELETE | `/meals/:id`          | Delete meal            |
| GET    | `/workouts/range?days=7` | Workouts in range   |
| POST   | `/workouts/add`       | Add workout            |
| DELETE | `/workouts/:id`       | Delete workout         |
| GET    | `/saved-exercises`    | Exercise library       |
| POST   | `/saved-exercises/add` | Save an exercise      |
| DELETE | `/saved-exercises/:id` | Delete exercise      |
| GET    | `/saved-meals`        | Meal library           |
| POST   | `/saved-meals/add`    | Save a meal            |
| DELETE | `/saved-meals/:id`    | Delete saved meal      |
