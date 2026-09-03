import "dotenv/config";
import dns from "node:dns";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import accountsRouter from "./routes/accounts.js";

// The default DNS resolver rejects MongoDB Atlas SRV lookups on this network.
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      process.env.CLIENT_URL || "http://localhost:5173",
      "http://127.0.0.1:5173"
    ]
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Banking API is running." });
});

app.use("/api/accounts", accountsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

async function startServer() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing. Create backend/.env first.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected.");

    app.listen(PORT, () => {
      console.log(`Backend running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
