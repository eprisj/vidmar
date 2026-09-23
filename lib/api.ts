/* The API answers on the site's own domain. It used to live under
   munister.com.ua, which left accounts, the cart and checkout on the new
   domain depending on the old one; that host still answers, so it stays a
   way back if this one ever fails. Auth travels as a Bearer header, not a
   cookie, so moving the hostname does not touch anyone's session. */
export const API_BASE =
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
    /** extra files the admin attached for e-book buyers */
    files?: { id: number; name: string; label: string | null; size: number | string }[];
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

/** For pages baked at build: `no-store` makes a static export bail out of
 * prerendering the fetch, which the callers' catch then turned into an
 * empty shelf without a word. */
export async function getBooksAtBuild(): Promise<Book[]> {
  try {
    const res = await fetch(`${API_BASE}/books`, { cache: "force-cache", signal: AbortSignal.timeout(8000) });
    return res.ok ? await res.json() : [];
  } catch (err) {
    console.warn("books not baked in:", err instanceof Error ? err.message : err);
    return [];
  }
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

/* The admin signs in with a login and password; the API answers with an
   HttpOnly session cookie, so nothing secret lives in the page or in
   localStorage any more. The `token` argument the calls below still take is
   ignored: it is kept so the pages did not all have to change at once. */
async function adminRequest(path: string, _token: string, init?: RequestInit) {
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

export function listAdminBooks(token: string): Promise<AdminBook[]> {
  return adminRequest("/admin/books", token);
}

export function listSubscribers(token: string): Promise<{ id: number; email: string; created_at: string }[]> {
  return adminRequest("/subscribers", token);
}

export function listSubmissions(token: string): Promise<Submission[]> {
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
      credentials: "include",
      headers: { "Content-Type": "application/octet-stream" },
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

export type Delivery = { cityRef: string; cityName: string; area?: string | null; warehouseRef: string; warehouseName: string };

export type User = {
  id: number;
  email: string;
  name: string | null;
  phone?: string | null;
  /** permanent reader card code, shown as a QR in the account */
  reader_code?: string | null;
  created_at?: string;
  delivery?: Delivery | null;
  newsletter?: boolean;
  /** signed in with Google at least once */
  google?: boolean;
  avatar_url?: string | null;
  /** false for an account made through Google that never set a password */
  has_password?: boolean;
};

export async function googleClientId(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/google/config`, { cache: "no-store" });
    return res.ok ? (await res.json()).clientId : null;
  } catch {
    return null;
  }
}

export async function googleSignIn(credential: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/google`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error || "не вдалося увійти через Google");
  return data;
}

export type ProfilePatch = Partial<{ name: string; phone: string; delivery: Delivery | null; newsletter: boolean }>;

export async function updateMe(patch: ProfilePatch): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await res.json().catch(() => null);
  // this endpoint answers in Ukrainian already
  if (!res.ok) throw new ApiError(data?.error || "не вдалося зберегти");
  return data;
}

export async function changePassword(current: string, next: string) {
  const res = await fetch(`${API_BASE}/auth/password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current, next }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error === "too many requests" ? "забагато спроб – спробуйте за хвилину" : data?.error || "не вдалося змінити пароль");
}

export async function checkReader(code: string): Promise<{ valid: boolean; since?: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/readers/${encodeURIComponent(code)}`, { cache: "no-store" });
    return res.json();
  } catch {
    return null;
  }
}

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

export type MyOrder = OrderSummary & {
  payment_method: PayMethod;
  access_token: string | null;
  ttn: string | null;
  items: { title: string; format: Format; quantity: number; cover_url: string | null; cover_pos: string | null }[];
};

export function listMyOrders(): Promise<MyOrder[]> {
  return userRequest("/orders");
}

export function getMyOrder(id: number): Promise<OrderDetail> {
  return userRequest(`/orders/${id}`);
}

// --- admin: users, orders --------------------------------------------

export type AdminUser = User & {
  created_at: string;
  np_city: string | null;
  np_warehouse: string | null;
  orders: number;
  spent_cents: number;
  last_order_at: string | null;
};

export type AdminStats = {
  revenue: string;
  revenue_30: string;
  paid_orders: number;
  orders_30: number;
  orders_today: number;
  awaiting_sum: string;
  by_status: Record<string, number>;
  days: { day: string; revenue: string; orders: number }[];
  low_stock: { id: number; title: string; sku: string | null; stock: number; cover_url: string | null; cover_pos: string | null }[];
  top: { id: number; title: string; sku: string | null; cover_url: string | null; cover_pos: string | null; sold: number; revenue: string }[];
  users: number;
  subscribers: number;
  submissions: number;
  submissions_7: number;
  books_live: number;
  books: number;
};

export async function adminLogin(login: string, password: string): Promise<{ login: string }> {
  const res = await fetch(`${API_BASE}/admin/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error === "too many requests" ? "забагато спроб, зачекайте кілька хвилин" : data?.error || "не вдалося увійти");
  return data;
}

export async function adminMe(): Promise<{ login: string } | null> {
  const res = await fetch(`${API_BASE}/admin/auth/me`, { credentials: "include", cache: "no-store" });
  return res.ok ? res.json() : null;
}

export async function adminLogout() {
  await fetch(`${API_BASE}/admin/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
}

export async function adminChangePassword(current: string, next: string) {
  const res = await fetch(`${API_BASE}/admin/auth/password`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ current, next }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error || "не вдалося змінити пароль");
}

export function getAdminStats(token: string, demo = false): Promise<AdminStats> {
  return adminRequest(`/admin/stats${demo ? "?demo=1" : ""}`, token);
}

export type Submission = {
  id: number;
  name: string;
  email: string;
  title: string | null;
  genre: string | null;
  note: string | null;
  status: "new" | "reading" | "accepted" | "declined";
  created_at: string;
};

export function setSubmissionStatus(token: string, id: number, status: Submission["status"]) {
  return adminRequest(`/admin/submissions/${id}`, token, { method: "PUT", body: JSON.stringify({ status }) });
}

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
  reader_code?: string | null;
  access_token?: string | null;
  np_city_ref?: string | null;
  items?: { title: string; sku: string | null; format: Format; quantity: number; cover_url: string | null; cover_pos: string | null }[];
};
export type AdminOrderDetail = Omit<AdminOrder, "items"> & {
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

/** Node's ICU writes the hryvnia as "₴" and browsers as "грн", so a price set
 * with Intl's currency style differed between the built page and the
 * hydrated one and React rebuilt the tree. The symbol is written by hand. */
export function formatPrice(cents: number, currency: string) {
  const n = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(cents / 100);
  return currency === "UAH" ? `${n} грн` : `${n} ${currency}`;
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

// --- admin: files on book cards, images, site texts, reports ---------------

export type FileAccess = "buyers" | "public" | "private";
export type BookFile = {
  id: number;
  book_id: number;
  name: string;
  label: string | null;
  mime: string;
  size: number | string;
  access: FileAccess;
  sort_order: number;
  created_at: string;
};

const CHUNK = 900 * 1024;

/** nginx caps a request at 1MB, so everything goes up in ~900KB parts */
async function chunkedUpload(path: string, file: File, query: Record<string, string>, onProgress?: (share: number) => void) {
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");
  const parts = Math.max(1, Math.ceil(file.size / CHUNK));
  let last: unknown = null;
  for (let i = 0; i < parts; i++) {
    const q = new URLSearchParams({ ...query, upload: id, part: String(i), name: file.name });
    if (i === parts - 1) q.set("last", "1");
    const res = await fetch(`${API_BASE}${path}?${q}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/octet-stream" },
      body: file.slice(i * CHUNK, (i + 1) * CHUNK),
    });
    last = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError((last as { error?: string } | null)?.error || `upload failed (${res.status})`);
    onProgress?.((i + 1) / parts);
  }
  return last;
}

export function listBookFiles(_token: string, bookId: number): Promise<BookFile[]> {
  return adminRequest(`/admin/books/${bookId}/files`, _token);
}

export function uploadBookFile(
  bookId: number,
  file: File,
  opts: { access: FileAccess; label?: string },
  onProgress?: (share: number) => void,
) {
  return chunkedUpload(`/admin/books/${bookId}/files`, file, { access: opts.access, label: opts.label ?? "" }, onProgress) as Promise<BookFile>;
}

export function updateBookFile(_token: string, fid: number, patch: Partial<Pick<BookFile, "label" | "access" | "sort_order">>) {
  return adminRequest(`/admin/files/${fid}`, _token, { method: "PUT", body: JSON.stringify(patch) }) as Promise<BookFile>;
}

export function deleteBookFile(_token: string, fid: number) {
  return adminRequest(`/admin/files/${fid}`, _token, { method: "DELETE" });
}

export const adminFileUrl = (fid: number) => `${API_BASE}/admin/files/${fid}`;
export const publicFileUrl = (fid: number) => `${API_BASE}/files/${fid}`;
export const buyerFileUrl = (orderId: number, token: string, fid: number) =>
  `${API_BASE}/orders/lookup/${orderId}/files/${fid}?t=${encodeURIComponent(token)}`;

export type PublicFile = { id: number; name: string; label: string | null; mime: string; size: number | string };
export async function getPublicBookFiles(slug: string): Promise<PublicFile[]> {
  const res = await fetch(`${API_BASE}/books/${encodeURIComponent(slug)}/files`, { cache: "no-store" });
  return res.ok ? res.json() : [];
}

/** an image for a cover or a page; returns its public address */
export async function uploadImage(file: File, onProgress?: (share: number) => void): Promise<string> {
  const out = (await chunkedUpload("/admin/media", file, {}, onProgress)) as { url: string };
  return out.url;
}

export function getStorage(_token: string): Promise<{ used: number; files: number; free: number; max_file: number }> {
  return adminRequest("/admin/storage", _token);
}

export type SavedText = { key: string; value: unknown; updated_at: string; updated_by: string | null; versions: number };
export function getAdminContent(_token: string): Promise<SavedText[]> {
  return adminRequest("/admin/content", _token);
}
export function saveContent(_token: string, values: Record<string, unknown>) {
  return adminRequest("/admin/content", _token, { method: "PUT", body: JSON.stringify({ values }) });
}
export function contentHistory(_token: string, key: string): Promise<{ id: number; value: unknown; changed_by: string | null; changed_at: string }[]> {
  return adminRequest(`/admin/content/history/${encodeURIComponent(key)}`, _token);
}

export type ReportKind = "sales" | "orders" | "catalog" | "readers" | "manuscripts";
/** fetched with the session cookie and handed to the browser as a download */
export async function downloadReport(kind: ReportKind, p: { from: string; to: string; demo: boolean }) {
  const q = new URLSearchParams({ from: p.from, to: p.to, demo: p.demo ? "1" : "0" });
  const res = await fetch(`${API_BASE}/admin/reports/${kind}?${q}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.error || `report failed (${res.status})`);
  }
  const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") || "")?.[1] || `vidmar-${kind}.pdf`;
  const a = document.createElement("a");
  a.href = URL.createObjectURL(await res.blob());
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export const fileSize = (n: number | string) => {
  const b = Number(n) || 0;
  if (b < 1024) return `${b} Б`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} КБ`;
  if (b < 1024 ** 3) return `${(b / 1024 / 1024).toFixed(b < 10 * 1024 * 1024 ? 1 : 0)} МБ`;
  return `${(b / 1024 ** 3).toFixed(1)} ГБ`;
};
