# Quizzzz

A full-stack quiz application with user authentication, MongoDB persistence, category and difficulty filters, unique questions, scoring, timer support, and a leaderboard.

## Tech Stack

- React 19
- TypeScript
- Vite
- Express 5
- MongoDB with Mongoose
- bcryptjs for password hashing
- csv-parse for the imported question dataset

## Features

- Registration and login
- Secure bcrypt password hashing
- MongoDB `users` collection
- MongoDB `leaderboard` collection
- 1,000 general knowledge questions
- Imported coding questions from `data/questions_dataset.csv`
- Ten quiz fields:
  - Geography
  - Computer Science
  - Current Affairs
  - Science
  - History
  - Arts & Culture
  - Sports
  - Nature
  - Literature
  - Business
- Four difficulty levels: Easy, Medium, Average, and Hard
- Unique questions in each quiz
- Quiz lengths of 10, 20, or 40 questions
- Optional timer
- Previous and next question navigation
- Results screen
- Top Scores page showing player name, email, field, difficulty, and score

## Requirements

- Node.js 18 or newer
- npm
- MongoDB Atlas or local MongoDB

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/rakshan-33/brainspark-quiz.git
cd quizzzz
npm install
```

Create a `.env` file in the project root by copying `.env.example`:

```bash
copy .env.example .env
```

Set the MongoDB connection string in `.env`:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/quiz?retryWrites=true&w=majority
```

For local MongoDB:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/quizzzz
```

Never commit `.env` or database passwords. The `.env` file is ignored by Git.

## Run Locally

Start the frontend and backend together:

```bash
npm run dev:full
```

Open the application at:

```text
http://127.0.0.1:5173
```

The backend API runs at:

```text
http://localhost:4000
```

To run them separately:

```bash
npm run server
npm run dev
```

MongoDB must be connected before registration, login, and leaderboard features will work.

## MongoDB Collections

The application uses the `quiz` database:

```text
quiz
├── users
└── leaderboard
```

The `users` collection stores:

- Name
- Email
- bcrypt password hash
- Created and updated timestamps

The `leaderboard` collection stores:

- Player name
- Player email
- Correct score
- Total questions
- Percentage
- Quiz field
- Difficulty
- Completion timestamp

Passwords are never stored as plain text.

## API Endpoints

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Quiz

```text
GET  /api/health
GET  /api/categories
GET  /api/difficulties
POST /api/quiz/start
POST /api/quiz/:sessionId/answer
POST /api/quiz/:sessionId/finish
```

Authenticated requests use:

```text
Authorization: Bearer YOUR_TOKEN
```

### Leaderboard

```text
GET /api/leaderboard
```

## Scripts

```bash
npm run dev:full  # Start frontend and backend
npm run dev       # Start Vite frontend only
npm run server    # Start Express backend only
npm run build     # Create production build
npm run lint      # Run Oxlint
npm run preview   # Preview production build
```

## Project Structure

```text
quizzzz/
├── data/
│   └── questions_dataset.csv
├── server/
│   └── index.ts
├── src/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── README.md
```

## Validation

Run these commands before pushing to GitHub:

```bash
npm run lint
npm run build
```

## Upload To GitHub

From the project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Before pushing, confirm that `.env` is not included:

```bash
git status --short
```
