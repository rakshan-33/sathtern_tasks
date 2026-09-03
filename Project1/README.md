# Banking Management System

A full-stack banking application built with:

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB + Mongoose

## Features

1. Create Account
2. Deposit Money
3. Withdraw Money
4. Check Balance
5. Transaction History
6. Frontend and backend input validation
7. MongoDB persistence
8. MongoDB transaction/session support so balance changes and transaction records are committed together
9. Withdrawal protection against insufficient balance

## 1. Install prerequisites

Install these first:

- Node.js LTS
- MongoDB Atlas account (recommended)
- VS Code or another code editor

Check Node:

```bash
node -v
npm -v
```

## 2. MongoDB Atlas setup from scratch

1. Open MongoDB Atlas and create an account.
2. Create a free cluster.
3. Create a database user:
   - Security / Database Access
   - Add New Database User
   - Choose a username and password.
4. Add your IP address:
   - Security / Network Access
   - Add IP Address
   - For local development, you can add your current IP.
   - Atlas may also offer `0.0.0.0/0`; this is convenient for development but is less restrictive, so use it only when appropriate.
5. Click Connect on your cluster.
6. Choose Drivers.
7. Select Node.js.
8. Copy the MongoDB connection string.

It will look similar to:

mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/banking_db?retryWrites=true&w=majority

Replace USERNAME and PASSWORD with the database user's credentials.

If your password contains special characters such as `@`, `#`, `/`, `:` or `%`, URL-encode the password.

## 3. Backend configuration

Open a terminal:

```bash
cd backend
npm install
```

Copy `.env.example` to `.env`.

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cp .env.example .env
```

Open `.env` and set:

```env
PORT=5000
MONGO_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/banking_db?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
```

Do NOT upload `.env` to GitHub.

Start backend:

```bash
npm run dev
```

You should see:

```text
MongoDB connected.
Backend running at http://localhost:5000
```

## 4. Frontend setup

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Vite will show a URL similar to:

```text
http://localhost:5173
```

Open that URL in your browser.

## 5. How the project stores data

Two MongoDB collections are created automatically by Mongoose:

### accounts

Example document:

```json
{
  "accountNumber": "12345678",
  "holderName": "Rahul Kumar",
  "email": "rahul@example.com",
  "phone": "9876543210",
  "balance": 5000,
  "createdAt": "2026-08-07T00:00:00.000Z",
  "updatedAt": "2026-08-07T00:00:00.000Z"
}
```

### transactions

Example document:

```json
{
  "accountNumber": "12345678",
  "type": "DEPOSIT",
  "amount": 1000,
  "balanceAfter": 6000,
  "description": "Cash deposit",
  "createdAt": "2026-08-07T00:00:00.000Z"
}
```

## 6. API endpoints

### Create account

POST `/api/accounts`

Body:

```json
{
  "holderName": "Rahul Kumar",
  "email": "rahul@example.com",
  "phone": "9876543210",
  "initialDeposit": 5000
}
```

### Check balance/account

GET `/api/accounts/:accountNumber`

### Deposit

POST `/api/accounts/:accountNumber/deposit`

Body:

```json
{
  "amount": 1000
}
```

### Withdraw

POST `/api/accounts/:accountNumber/withdraw`

Body:

```json
{
  "amount": 500
}
```

### Transaction history

GET `/api/accounts/:accountNumber/transactions`

## 7. Important validation

The backend is the final authority for validation. The frontend validation is only for user experience.

- Name: 2–80 characters
- Email: basic email format
- Phone: 10-digit Indian mobile number starting from 6–9
- Amount: greater than 0
- Amount: maximum 2 decimal places
- Amount: maximum 10,000,000 per operation
- Balance can never become negative
- Account number is unique

## 8. Recommended project structure

```text
banking-management-system/
├── backend/
│   ├── models/
│   │   ├── Account.js
│   │   └── Transaction.js
│   ├── routes/
│   │   └── accounts.js
│   ├── utils/
│   │   ├── accountNumber.js
│   │   └── validation.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 9. Important note about MongoDB transactions

This project uses Mongoose sessions/transactions so that a money update and its transaction-history record are committed together.

For that reason, MongoDB Atlas is the easiest setup for this project. MongoDB transactions require a deployment that supports transactions, such as a replica set or sharded cluster.

## 10. Test the application

Suggested test:

1. Create an account with initial deposit ₹5,000.
2. Confirm the account number shown.
3. Load/check the account.
4. Deposit ₹1,000.
5. Balance should become ₹6,000.
6. Withdraw ₹2,000.
7. Balance should become ₹4,000.
8. Open transaction history.
9. Confirm account creation, deposit and withdrawal are listed.
10. Try withdrawing ₹10,000 from a ₹4,000 account.
11. The backend should reject it with "Insufficient balance."
12. Refresh the browser and load the account again. Data should still be in MongoDB.

## 11. Production/security note

This is a college/demo banking management project, not production banking software. Real banking systems need authentication, authorization, encryption, audit controls, rate limiting, fraud detection, KYC/AML controls, secure secrets management, and much stronger financial consistency/audit requirements.
