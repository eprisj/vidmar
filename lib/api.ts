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
  excerpt?: string | null;
  cover_pos?: string | null;
  print_price_cents?: number | null;
  ebook_price_cents?: number | null;
  in_stock?: boolean;
  pages?: number | null;
  year?: number | null;
  binding?: string | null;
  isbn?: string | null;
  is_demo?: boolean;
  sku?: string | null;
  print_old_price_cents?: number | null;
  ebook_old_price_cents?: number | null;
  series?: string | null;
  language?: string | null;
  translator?: string | null;
  illustrator?: string | null;
  dimensions?: string | null;
  weight_g?: number | null;
  age_rating?: string | null;
  /** only told when few are left (5 or fewer) */
  stock_left?: number | null;
};

export type Format = "print" | "ebook";

export const FORMAT_LABEL: Record<Format, string> = { print: "Паперова", ebook: "Електронна" };

/** VDM-0007 + format: -P for paper, -E for the e-book */
export function formatSku(sku: string | null | undefined, format: Format) {
  return sku ? `${sku}-${format === "ebook" ? "E" : "P"}` : null;
}

/** the struck-through price, only when it is really above the price */
export function oldPrice(b: Book, format: Format) {
  const now = format === "print" ? b.print_price_cents : b.ebook_price_cents;
  const was = format === "print" ? b.print_old_price_cents : b.ebook_old_price_cents;
  return now != null && was != null && was > now ? was : null;
}

export function discountPct(now: number, was: number) {
  return Math.round((1 - now / was) * 100);
}

export async function getBook(slug: string): Promise<Book | null> {
  const res = await fetch(`${API_BASE}/books/${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

// --- Nova Poshta, through our API so the key stays on the server ----------

export type NpCity = { ref: string; name: string; area: string };
export type NpWarehouse = { ref: string; name: string; number: string };

export async function npCities(q: string): Promise<NpCity[]> {
  const res = await fetch(`${API_BASE}/np/cities?q=${encodeURIComponent(q)}`);
  return res.ok ? res.json() : [];
}

export async function npWarehouses(city: string, q = ""): Promise<NpWarehouse[]> {
  const res = await fetch(`${API_BASE}/np/warehouses?city=${city}&q=${encodeURIComponent(q)}`);
  return res.ok ? res.json() : [];
}

// --- guest checkout -----------------------------------------------------------

export type OrderInput = {
  items: { slug: string; format: Format; quantity: number }[];
  customer: { name: string; phone: string; email: string };
  delivery?: { cityRef: string; cityName: string; warehouseRef: string; warehouseName: string };
  comment?: string;
  payment_method: PayMethod;
};

export type PlacedOrder = {
  id: number;
  total_cents: number;
  currency: string;
  access_token: string;
  payment_method: PayMethod;
  /** the provider's page, for card/Privat24 payments */
  payment_url: string | null;
};

// --- payments -------------------------------------------------------------

export type PayMethod = "mono" | "liqpay" | "iban" | "cod";

export async function getPayMethods(): Promise<{ id: PayMethod; enabled: boolean }[]> {
  try {
    const res = await fetch(`${API_BASE}/pay/methods`, { cache: "no-store" });
    if (res.ok) return res.json();
  } catch {
    /* offline API: fall back to what always works */
  }
  return [
    { id: "iban", enabled: true },
    { id: "cod", enabled: true },
  ];
}

export async function payOrder(id: number, token: string, method?: PayMethod): Promise<string> {
  const res = await fetch(`${API_BASE}/orders/lookup/${id}/pay?t=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.url) throw new ApiError(data?.error || "не вдалося відкрити оплату");
  return data.url;
}

export async function placeOrder(input: OrderInput): Promise<PlacedOrder> {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => null);
  // the checkout endpoint already answers in Ukrainian
  if (!res.ok) throw new ApiError(data?.error || "не вдалося оформити замовлення");
  return data;
}

export type PublicOrder = OrderSummary & {
  customer_name: string;
  np_city: string | null;
  np_warehouse: string | null;
  ttn: string | null;
  is_demo: boolean;
  payment_method: PayMethod;
  paid_at: string | null;
  can_pay_online: boolean;
  requisites: { iban: string; recipient: string | null; edrpou: string | null; bank: string | null } | null;
  items: (OrderItem & {
    format: Format;
    sku: string | null;
    slug: string | null;
    cover_url: string | null;
    cover_pos: string | null;
    has_pdf: boolean;
    has_epub: boolean;
  })[];
};

export function ebookUrl(orderId: number, token: string, slug: string, kind: "pdf" | "epub") {
  return `${API_BASE}/orders/lookup/${orderId}/file/${encodeURIComponent(slug)}/${kind}?t=${encodeURIComponent(token)}`;
}

export async function lookupOrder(id: string, token: string): Promise<PublicOrder | null> {
  const res = await fetch(`${API_BASE}/orders/lookup/${encodeURIComponent(id)}?t=${encodeURIComponent(token)}`, {
    cache: "no-store",
  });
  return res.ok ? res.json() : null;
}

export async function getBooks(): Promise<Book[]> {
  const res = await fetch(`${API_BASE}/books`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export type AdminBook = Book & {
  id: number;
  stock?: number | null;
  ebook_pdf?: string | null;
  ebook_epub?: string | null;
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
  print_price_cents?: number | null;
  ebook_price_cents?: number | null;
  stock?: number | null;
  pages?: number | null;
  year?: number | null;
  binding?: string | null;
  isbn?: string | null;
  excerpt?: string | null;
  cover_pos?: string | null;
  is_demo?: boolean;
  sku?: string | null;
  print_old_price_cents?: number | null;
  ebook_old_price_cents?: number | null;
  series?: string | null;
  language?: string | null;
  translator?: string | null;
  illustrator?: string | null;
  dimensions?: string | null;
  weight_g?: number | null;
  age_rating?: string | null;
};

export function createBook(token: string, input: BookInput) {
  return adminRequest("/admin/books", token, { method: "POST", body: JSON.stringify(input) });
}

export function updateBook(token: string, id: number, input: Partial<BookInput>) {
  return adminRequest(`/admin/books/${id}`, token, { method: "PUT", body: JSON.stringify(input) });
}

/** Sent in ~900KB parts: the proxy in front of the API refuses bodies over 1MB. */
export async function uploadEbook(
  token: string,
  id: number,
  kind: "pdf" | "epub",
  file: File,
  onProgress?: (share: number) => void,
) {
  const CHUNK = 900 * 1024;
  const parts = Math.max(1, Math.ceil(file.size / CHUNK));
  for (let i = 0; i < parts; i++) {
    const body = file.slice(i * CHUNK, (i + 1) * CHUNK);
    const res = await fetch(`${API_BASE}/admin/books/${id}/ebook/${kind}?part=${i}${i === parts - 1 ? "&last=1" : ""}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/octet-stream" },
      body,
    });
    if (!res.ok) throw new ApiError(`upload failed (${res.status})`);
    onProgress?.((i + 1) / parts);
  }
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

export type AdminOrder = OrderSummary & {
  user_email: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  np_city?: string | null;
  np_warehouse?: string | null;
  ttn?: string | null;
  comment?: string | null;
  is_demo?: boolean;
  payment_method?: PayMethod;
  paid_at?: string | null;
};
export type AdminOrderDetail = AdminOrder & {
  items: (OrderItem & { format?: Format; sku?: string | null })[];
  payments: { provider: string; provider_ref: string; amount_cents: number; status: string; created_at: string }[];
};

export function listAdminOrders(token: string): Promise<AdminOrder[]> {
  return adminRequest("/admin/orders", token);
}

export function getAdminOrder(token: string, id: number): Promise<AdminOrderDetail> {
  return adminRequest(`/admin/orders/${id}`, token);
}

export function setOrderStatus(token: string, id: number, status: string) {
  return adminRequest(`/admin/orders/${id}`, token, { method: "PUT", body: JSON.stringify({ status }) });
}

export function setOrderTtn(token: string, id: number, ttn: string) {
  return adminRequest(`/admin/orders/${id}`, token, { method: "PUT", body: JSON.stringify({ ttn }) });
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
