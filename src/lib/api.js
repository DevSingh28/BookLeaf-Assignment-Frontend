import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5112/api",
  withCredentials: true,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Common error handler
export function getErrorMessage(
  error,
  fallback = "Something went wrong. Please try again."
) {
  
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    if (error.code === "ECONNABORTED") {
      return "The request timed out. Please try again.";
    }

    if (!error.response) {
      return "Unable to reach the server. Check your connection and try again.";
    }
  }

  return fallback;
}

// Build query parameters without manually concatenating URLs.
function queryParams(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

// Authentication
export const authApi = {
  signup: (payload) => api.post("/auth/signup", payload),
  login: (payload) => api.post("/auth/login", payload),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// Author dashboard
export const dashboardApi = {
  getDashboard: () => api.get("/dashboard"),
};

// Author books
export const booksApi = {
  getBooks: (params = {}) =>
    api.get("/books", { params: queryParams(params) }),

  getBook: (bookId) =>
    api.get(`/books/${encodeURIComponent(bookId)}`),

  getBookRoyalties: (bookId) =>
    api.get(`/books/${encodeURIComponent(bookId)}/royalties`),
};

// Author support tickets
export const ticketsApi = {
  getTickets: (params = {}) =>
    api.get("/tickets", { params: queryParams(params) }),

  getTicket: (ticketId) =>
    api.get(`/tickets/${encodeURIComponent(ticketId)}`),

  createTicket: (payload) =>
    api.post("/tickets", payload),

  getMessages: (ticketId, params = {}) =>
    api.get(
      `/tickets/${encodeURIComponent(ticketId)}/messages`,
      { params: queryParams(params) }
    ),

  sendMessage: (ticketId, payload) =>
    api.post(
      `/tickets/${encodeURIComponent(ticketId)}/messages`,
      payload
    ),
};

// Author profile
export const profileApi = {
  getProfile: () => api.get("/profile"),
  updateProfile: (payload) => api.patch("/profile", payload),
};

// Published knowledge base
export const knowledgeBaseApi = {
  getArticles: (params = {}) =>
    api.get("/knowledge-base", { params: queryParams(params) }),
};

// Admin dashboard
export const adminDashboardApi = {
  getDashboard: () => api.get("/admin/dashboard"),
};

// Admin ticket management
export const adminTicketsApi = {
  getTickets: (params = {}) =>
    api.get("/admin/tickets", { params: queryParams(params) }),

  getTicket: (ticketId) =>
    api.get(`/admin/tickets/${encodeURIComponent(ticketId)}`),

  updateStatus: (ticketId, payload) =>
    api.patch(
      `/admin/tickets/${encodeURIComponent(ticketId)}/status`,
      payload
    ),

  updatePriority: (ticketId, payload) =>
    api.patch(
      `/admin/tickets/${encodeURIComponent(ticketId)}/priority`,
      payload
    ),

  updateCategory: (ticketId, payload) =>
    api.patch(
      `/admin/tickets/${encodeURIComponent(ticketId)}/category`,
      payload
    ),

  assignTicket: (ticketId, payload) =>
    api.patch(
      `/admin/tickets/${encodeURIComponent(ticketId)}/assign`,
      payload
    ),

  addInternalNote: (ticketId, payload) =>
    api.post(
      `/admin/tickets/${encodeURIComponent(ticketId)}/notes`,
      payload
    ),

  replyToTicket: (ticketId, payload) =>
    api.post(
      `/admin/tickets/${encodeURIComponent(ticketId)}/reply`,
      payload
    ),

  classifyWithAI: (ticketId) =>
    api.post(
      `/admin/tickets/${encodeURIComponent(ticketId)}/ai/classify`
    ),

  generateAIDraft: (ticketId) =>
    api.post(
      `/admin/tickets/${encodeURIComponent(ticketId)}/ai/draft`
    ),
};

export default api;