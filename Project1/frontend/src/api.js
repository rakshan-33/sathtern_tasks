const API_BASE = `${window.location.protocol}//${window.location.hostname}:5000/api`;

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Request failed.");
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  createAccount: (body) =>
    request("/accounts", {
      method: "POST",
      body: JSON.stringify(body)
    }),

  getAccount: (accountNumber) =>
    request(`/accounts/${encodeURIComponent(accountNumber)}`),

  deposit: (accountNumber, amount) =>
    request(`/accounts/${encodeURIComponent(accountNumber)}/deposit`, {
      method: "POST",
      body: JSON.stringify({ amount })
    }),

  withdraw: (accountNumber, amount) =>
    request(`/accounts/${encodeURIComponent(accountNumber)}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ amount })
    }),

  getTransactions: (accountNumber) =>
    request(`/accounts/${encodeURIComponent(accountNumber)}/transactions`)
};
