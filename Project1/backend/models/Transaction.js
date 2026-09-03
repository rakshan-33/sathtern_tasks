import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    accountNumber: {
      type: String,
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ["ACCOUNT_CREATED", "DEPOSIT", "WITHDRAW"],
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    balanceAfter: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200
    }
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);