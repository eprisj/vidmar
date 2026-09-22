/* The API answers on the site's own domain. It used to live under
   munister.com.ua, which left accounts, the cart and checkout on the new
   domain depending on the old one; that host still answers, so it stays a
   way back if this one ever fails. Auth travels as a Bearer header, not a
   cookie, so moving the hostname does not touch anyone's session. */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://api.vidmar.com.ua";

export class ApiError extends Error {}

async function post(path: string, body: unknown) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.error || "server error");
  }
  return res.json();
}

export function subscribe(email: string) {
  return post("/subscribe", { email });
}

export type SubmissionInput = {
  name: string;
  email: string;
  title?: string;
  genre?: string;
  note: string;
};

export function submitManuscript(input: SubmissionInput) {
  return post("/submissions", input);
}

export type Book = {
  slug: string;
  title: string;
  author: string | null;
  genre_slug: string | null;
  description: string | null;
  cover_url: string | null;
  status: string;
  price_cents: number | null;
  currency: string;
};

export async function getBooks(): Promise<Book[]> {
  const res = await fetch(`${API_BASE}/books`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export type AdminBook = Book & {
  id: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function adminHeaders(token: string) {
  return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

async function adminRequest(path: string, token: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...adminHeaders(token), ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.error || `request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export function listAdminBooks(token: string): Promise<AdminBook[]> {
  return adminRequest("/admin/books", token);
}

export function listSubscribers(token: string) {
  return adminRequest("/subscribers", token);
}

export function listSubmissions(token: string) {
  return adminRequest("/submissions", token);
}

export type BookInput = {
  slug: string;
  title: string;
  author?: string;
  genre_slug?: string;
  description?: string;
  cover_url?: string;
  status?: string;
  sort_order?: number;
  price_cents?: number | null;
  currency?: string;
};

export function createBook(token: string, input: BookInput) {
  return adminRequest("/admin/books", token, { method: "POST", body: JSON.stringify(input) });
}

export function updateBook(token: string, id: number, input: Partial<BookInput>) {
  return adminRequest(`/admin/books/${id}`, token, { method: "PUT", body: JSON.stringify(input) });
}

export function deleteBook(token: string, id: number) {
  return adminRequest(`/admin/books/${id}`, token, { method: "DELETE" });
}

// --- auth / account (cookie session, sent to the API's own domain) --------

export type User = { id: number; email: string; name: string | null };

async function userRequest(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.error || `request failed (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}

export function register(email: string, password: string, name?: string): Promise<User> {
  return userRequest("/auth/register", { method: "POST", body: JSON.stringify({ email, password, name }) });
}

export function login(email: string, password: string): Promise<User> {
  return userRequest("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
}

export function logout() {
  return userRequest("/auth/logout", { method: "POST" });
}

export function getMe(): Promise<User> {
  return userRequest("/auth/me");
}

// --- cart -------------------------------------------------------------

export type CartItem = {
  slug: string;
  title: string;
  cover_url: string | null;
  price_cents: number;
  currency: string;
  quantity: number;
};

export function getCart(): Promise<CartItem[]> {
  return userRequest("/cart");
}

export function addToCart(slug: string, quantity = 1) {
  return userRequest("/cart", { method: "POST", body: JSON.stringify({ slug, quantity }) });
}

export function removeFromCart(slug: string) {
  return userRequest(`/cart/${encodeURIComponent(slug)}`, { method: "DELETE" });
}

// --- orders -------------------------------------------------------------

export type OrderSummary = {
  id: number;
  status: string;
  total_cents: number;
  currency: string;
  created_at: string;
};

export type OrderItem = { title: string; price_cents: number; quantity: number };
export type OrderDetail = OrderSummary & { items: OrderItem[] };

export function checkout(): Promise<OrderDetail> {
  return userRequest("/orders/checkout", { method: "POST" });
}

export function listMyOrders(): Promise<OrderSummary[]> {
  return userRequest("/orders");
}

export function getMyOrder(id: number): Promise<OrderDetail> {
  return userRequest(`/orders/${id}`);
}

// --- admin: users, orders --------------------------------------------

export type AdminUser = User & { created_at: string };

export function listAdminUsers(token: string): Promise<AdminUser[]> {
  return adminRequest("/admin/users", token);
}

export type AdminOrder = OrderSummary & { user_email: string };
export type AdminOrderDetail = AdminOrder & { items: OrderItem[] };

export function listAdminOrders(token: string): Promise<AdminOrder[]> {
  return adminRequest("/admin/orders", token);
}

export function getAdminOrder(token: string, id: number): Promise<AdminOrderDetail> {
  return adminRequest(`/admin/orders/${id}`, token);
}

export function setOrderStatus(token: string, id: number, status: string) {
  return adminRequest(`/admin/orders/${id}`, token, { method: "PUT", body: JSON.stringify({ status }) });
}

export function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("uk-UA", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    cents / 100,
  );
}

// --- error messages ------------------------------------------------------

/** The API answers in English ("not signed in", "invalid email or password"),
 * and the forms printed `err.message` straight to the reader, so a Ukrainian
 * site could answer an author in English. */
const MESSAGES: Record<string, string> = {
  "not signed in": "спершу увійдіть у кабінет",
  "invalid email": "перевірте адресу пошти",
  "invalid email or password": "невірна пошта або пароль",
  "email already registered": "ця пошта вже зареєстрована",
  "password too short": "пароль закороткий – мінімум 8 символів",
  "too many requests": "забагато спроб – спробуйте за кілька хвилин",
  "cart is empty": "кошик порожній",
  "name, email and note are required": "заповніть імʼя, пошту й кілька слів про рукопис",
};

/**
 * A Ukrainian line for an API failure. Anything the table doesn't know falls
 * back to `fallback` rather than leaking the server's own English wording.
 */
export function apiMessage(err: unknown, fallback = "щось пішло не так, спробуйте ще раз"): string {
  if (!(err instanceof ApiError)) return fallback;
  return MESSAGES[err.message] ?? fallback;
}
