import { useState } from "react";
import { api } from "./api";

const emptyCreate = {
  holderName: "",
  email: "",
  phone: "",
  initialDeposit: ""
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR"
  }).format(Number(value || 0));
}

function formatDate(value) {
  return new Date(value).toLocaleString("en-IN");
}

export default function App() {
  const [accountNumber, setAccountNumber] = useState("");
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [createForm, setCreateForm] = useState(emptyCreate);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function clearStatus() {
    setMessage("");
    setError("");
  }

  async function handleCreate(event) {
    event.preventDefault();
    clearStatus();

    if (!createForm.holderName.trim() || !createForm.email.trim() || !createForm.phone.trim()) {
      setError("Please fill all required account fields.");
      return;
    }

    const initialDeposit = Number(createForm.initialDeposit || 0);
    if (!Number.isFinite(initialDeposit) || initialDeposit < 0) {
      setError("Initial deposit must be 0 or greater.");
      return;
    }

    try {
      setLoading(true);
      const data = await api.createAccount({
        ...createForm,
        initialDeposit
      });

      setAccount(data.account);
      setAccountNumber(data.account.accountNumber);
      setCreateForm(emptyCreate);
      setMessage(`Account created. Account number: ${data.account.accountNumber}`);
      await loadTransactions(data.account.accountNumber);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAccount(event) {
    event?.preventDefault();
    clearStatus();

    if (!accountNumber.trim()) {
      setError("Enter an account number.");
      return;
    }

    try {
      setLoading(true);
      const data = await api.getAccount(accountNumber.trim());
      setAccount(data.account);
      await loadTransactions(accountNumber.trim());
      setMessage("Account loaded successfully.");
    } catch (err) {
      setAccount(null);
      setTransactions([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTransactions(number = accountNumber) {
    const data = await api.getTransactions(number.trim());
    setTransactions(data.transactions);
  }

  async function handleMoneyAction(type) {
    clearStatus();

    const value = Number(amount);
    if (!account) {
      setError("Load or create an account first.");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }

    try {
      setLoading(true);
      const data =
        type === "deposit"
          ? await api.deposit(account.accountNumber, value)
          : await api.withdraw(account.accountNumber, value);

      setAccount(data.account);
      setAmount("");
      await loadTransactions(account.accountNumber);
      setMessage(type === "deposit" ? "Deposit successful." : "Withdrawal successful.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">FULL-STACK PROJECT</p>
          <h1>Banking Management System</h1>
          <p>Create accounts, manage money and view complete transaction history.</p>
        </div>
      </header>

      <main className="container">
        {(message || error) && (
          <div className={error ? "alert error" : "alert success"}>
            {error || message}
          </div>
        )}

        <section className="grid">
          <div className="card">
            <h2>Create Account</h2>
            <form onSubmit={handleCreate}>
              <label>
                Account Holder Name
                <input
                  value={createForm.holderName}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, holderName: e.target.value })
                  }
                  placeholder="Enter full name"
                  maxLength="80"
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, email: e.target.value })
                  }
                  placeholder="name@example.com"
                />
              </label>

              <label>
                Phone
                <input
                  value={createForm.phone}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                  }
                  placeholder="10-digit mobile number"
                />
              </label>

              <label>
                Initial Deposit
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.initialDeposit}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, initialDeposit: e.target.value })
                  }
                  placeholder="0.00"
                />
              </label>

              <button disabled={loading} type="submit">
                {loading ? "Processing..." : "Create Account"}
              </button>
            </form>
          </div>

          <div className="card">
            <h2>Find Account</h2>
            <form onSubmit={loadAccount}>
              <label>
                Account Number
                <input
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                  placeholder="8-digit account number"
                  maxLength="8"
                />
              </label>
              <button disabled={loading} type="submit">
                {loading ? "Loading..." : "Check Account"}
              </button>
            </form>

            {account && (
              <div className="account-summary">
                <div>
                  <span>Account</span>
                  <strong>{account.accountNumber}</strong>
                </div>
                <div>
                  <span>Holder</span>
                  <strong>{account.holderName}</strong>
                </div>
                <div className="balance">
                  <span>Current Balance</span>
                  <strong>{formatMoney(account.balance)}</strong>
                </div>
              </div>
            )}
          </div>

          <div className="card">
            <h2>Deposit / Withdraw</h2>
            <label>
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
              />
            </label>

            <div className="button-row">
              <button
                disabled={loading || !account}
                onClick={() => handleMoneyAction("deposit")}
              >
                Deposit Money
              </button>
              <button
                className="secondary"
                disabled={loading || !account}
                onClick={() => handleMoneyAction("withdraw")}
              >
                Withdraw Money
              </button>
            </div>

            <p className="hint">
              Withdrawals are rejected automatically when the balance is insufficient.
            </p>
          </div>

          <div className="card history-card">
            <div className="history-heading">
              <h2>Transaction History</h2>
              {account && (
                <button
                  className="small-button"
                  onClick={() => loadTransactions(account.accountNumber)}
                >
                  Refresh
                </button>
              )}
            </div>

            {!account ? (
              <p className="empty">Create or load an account to see transactions.</p>
            ) : transactions.length === 0 ? (
              <p className="empty">No transactions found.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Balance After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx._id}>
                        <td>{formatDate(tx.createdAt)}</td>
                        <td>
                          <span className={`badge ${tx.type.toLowerCase()}`}>
                            {tx.type.replace("_", " ")}
                          </span>
                        </td>
                        <td>{formatMoney(tx.amount)}</td>
                        <td>{formatMoney(tx.balanceAfter)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer>
        Banking Management System • React + Node.js + Express + MongoDB
      </footer>
    </div>
  );
}