export function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function validateAccountInput(body) {
  const holderName = cleanText(body.holderName);
  const email = cleanText(body.email).toLowerCase();
  const phone = cleanText(body.phone);
  const initialDeposit = Number(body.initialDeposit ?? 0);

  const errors = {};

  if (holderName.length < 2 || holderName.length > 80) {
    errors.holderName = "Name must be between 2 and 80 characters.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!/^[6-9]\d{9}$/.test(phone)) {
    errors.phone = "Enter a valid 10-digit Indian mobile number.";
  }

  if (!Number.isFinite(initialDeposit) || initialDeposit < 0) {
    errors.initialDeposit = "Initial deposit must be 0 or greater.";
  }

  if (initialDeposit > 10000000) {
    errors.initialDeposit = "Initial deposit is too large.";
  }

  return { errors, holderName, email, phone, initialDeposit };
}

export function validateAmount(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { amount, error: "Amount must be greater than 0." };
  }

  if (amount > 10000000) {
    return { amount, error: "Amount is too large." };
  }

  // Allow money values only up to 2 decimal places.
  if (Math.round(amount * 100) / 100 !== amount) {
    return { amount, error: "Amount can have at most 2 decimal places." };
  }

  return { amount, error: null };
}