import express from "express";
import mongoose from "mongoose";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import { generateAccountNumber } from "../utils/accountNumber.js";
import { validateAccountInput, validateAmount } from "../utils/validation.js";

const router = express.Router();

async function createUniqueAccountNumber() {
  for (let i = 0; i < 10; i++) {
    const accountNumber = generateAccountNumber();
    const exists = await Account.exists({ accountNumber });
    if (!exists) return accountNumber;
  }
  throw new Error("Could not generate a unique account number.");
}

// Create account
router.post("/", async (req, res) => {
  const validation = validateAccountInput(req.body);

  if (Object.keys(validation.errors).length) {
    return res.status(400).json({ message: "Validation failed.", errors: validation.errors });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const accountNumber = await createUniqueAccountNumber();

    const [account] = await Account.create(
      [{
        accountNumber,
        holderName: validation.holderName,
        email: validation.email,
        phone: validation.phone,
        balance: validation.initialDeposit
      }],
      { session }
    );

    await Transaction.create(
      [{
        accountNumber,
        type: "ACCOUNT_CREATED",
        amount: validation.initialDeposit,
        balanceAfter: validation.initialDeposit,
        description: "Bank account created"
      }],
      { session }
    );

    await session.commitTransaction();

    return res.status(201).json({
      message: "Account created successfully.",
      account
    });
  } catch (error) {
    await session.abortTransaction();
    console.error(error);

    if (error.code === 11000) {
      return res.status(409).json({ message: "Account number conflict. Please try again." });
    }

    return res.status(500).json({ message: "Failed to create account." });
  } finally {
    await session.endSession();
  }
});

// Get account by account number
router.get("/:accountNumber", async (req, res) => {
  try {
    const account = await Account.findOne({
      accountNumber: req.params.accountNumber.trim()
    }).lean();

    if (!account) {
      return res.status(404).json({ message: "Account not found." });
    }

    return res.json({ account });
  } catch {
    return res.status(500).json({ message: "Failed to fetch account." });
  }
});

// Deposit money
router.post("/:accountNumber/deposit", async (req, res) => {
  const { amount, error } = validateAmount(req.body.amount);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const account = await Account.findOneAndUpdate(
      { accountNumber: req.params.accountNumber.trim() },
      { $inc: { balance: amount } },
      { new: true, session, runValidators: true }
    );

    if (!account) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Account not found." });
    }

    await Transaction.create(
      [{
        accountNumber: account.accountNumber,
        type: "DEPOSIT",
        amount,
        balanceAfter: account.balance,
        description: "Cash deposit"
      }],
      { session }
    );

    await session.commitTransaction();

    return res.json({
      message: "Money deposited successfully.",
      account
    });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    return res.status(500).json({ message: "Deposit failed." });
  } finally {
    await session.endSession();
  }
});

// Withdraw money
router.post("/:accountNumber/withdraw", async (req, res) => {
  const { amount, error } = validateAmount(req.body.amount);

  if (error) {
    return res.status(400).json({ message: error });
  }

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // The condition prevents the balance from ever going below zero.
    const account = await Account.findOneAndUpdate(
      {
        accountNumber: req.params.accountNumber.trim(),
        balance: { $gte: amount }
      },
      { $inc: { balance: -amount } },
      { new: true, session, runValidators: true }
    );

    if (!account) {
      const exists = await Account.exists({
        accountNumber: req.params.accountNumber.trim()
      }).session(session);

      await session.abortTransaction();

      if (!exists) {
        return res.status(404).json({ message: "Account not found." });
      }

      return res.status(400).json({ message: "Insufficient balance." });
    }

    await Transaction.create(
      [{
        accountNumber: account.accountNumber,
        type: "WITHDRAW",
        amount,
        balanceAfter: account.balance,
        description: "Cash withdrawal"
      }],
      { session }
    );

    await session.commitTransaction();

    return res.json({
      message: "Money withdrawn successfully.",
      account
    });
  } catch (err) {
    await session.abortTransaction();
    console.error(err);
    return res.status(500).json({ message: "Withdrawal failed." });
  } finally {
    await session.endSession();
  }
});

// Transaction history
router.get("/:accountNumber/transactions", async (req, res) => {
  try {
    const accountNumber = req.params.accountNumber.trim();

    const exists = await Account.exists({ accountNumber });
    if (!exists) {
      return res.status(404).json({ message: "Account not found." });
    }

    const transactions = await Transaction.find({ accountNumber })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ transactions });
  } catch {
    return res.status(500).json({ message: "Failed to fetch transaction history." });
  }
});

export default router;