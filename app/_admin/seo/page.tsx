"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAdmin } from "@/components/admin/AdminShell";
import s from "@/components/admin/admin.module.css";
import p from "@/components/admin/plus.module.css";
import SerpPreview, { Count } from "@/components/admin/SerpPreview";
import { getSettings, listAdminBooks, saveSeo, uploadImage, type AdminBook, type SeoSettings } from "@/lib/api";

const SITE = "https://vidmar.com.ua";

/** the texts written in the pages, shown as placeholders: an empty field keeps them */
const PAGES: { key: string; path: string; label: string; title: string; description: string }[] = [
  {
    key: "home",
    path: "/",
    label: "Головна",
    title: "ВІДЬМАР – видавництво",
    description: "ВІДЬМАР – бутикове видавництво книг про езотерику, містику й відьомство. Готуємо перше видання і відкриті до рукописів.",
  },
  { key: "catalog", path: "/catalog", label: "Каталог", title: "Каталог – ВІДЬМАР", description: "Книги видавництва ВІДЬМАР: паперові й електронні видання з доставкою Новою поштою." },
  {
    key: "genres",
    path: "/genres",
    label: "Напрями",
    title: "Напрями – ВІДЬМАР",
    description: "Що видає ВІДЬМАР: езотерика, містика, відьомство й духовні практики, трилери, психологічні романи, фентезі та містична проза.",
  },
  {
    key: "about",
    path: "/about",
    label: "Про нас",
    title: "Про нас – ВІДЬМАР",
    description: "ВІДЬМАР – бутикове видавництво книг про езотерику, містику й відьомство. Лист засновника: хто ми, чому починаємо і що робимо.",
  },
  { key: "submissions", path: "/submissions", label: "Авторам", title: "Авторам – ВІДЬМАР", description: "Умови прийому рукописів у видавництво ВІДЬМАР: що ми шукаємо і як надіслати текст." },
  {
    key: "journal",
    path: "/journal",
    label: "Журнал",
    title: "Журнал – ВІДЬМАР",
    description: "Журнал видавництва ВІДЬМАР – записи про підготовку першої книги зʼявляться тут ближче до випуску.",
  },
];

const SOCIAL: { key: string; label: string; ph: string }[] = [
  { key: "instagram", label: "Instagram", ph: "https://instagram.com/…" },
  { key: "telegram", label: "Telegram", ph: "https://t.me/…" },
  { key: "facebook", label: "Facebook", ph: "https://facebook.com/…" },
  { key: "tiktok", label: "TikTok", ph: "https://tiktok.com/@…" },
  { key: "youtube", label: "YouTube", ph: "https://youtube.com/@…" },
  { key: "threads", label: "Threads", ph: "https://threads.net/@…" },
  { key: "x", label: "X (Twitter)", ph: "https://x.com/…" },
];

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className={s.panel} style={{ marginBottom: 18 }}>
      <div className={s.panelHead}>
        <h2 className={s.h2}>{title}</h2>
        {sub && <span className={s.dim}>{sub}</span>}
      </div>
      <div className={s.panelBody} style={{ display: "grid", gap: 14 }}>
        {children}
      </div>
    </section>
  );
}

export default function SeoPage() {
  const { token, fail } = useAdmin();
  const [seo, setSeo] = useState<SeoSettings | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      Promise.all([getSettings(token), listAdminBooks(token)])
        .then(([st, b]) => {
          setSeo(st.values.seo);
          setSaved(JSON.stringify(st.values.seo));
          setBooks(b);
        })
        .catch((e) => setError(fail(e))),
    [token, fail],
  );
  useEffect(() => {
    load();
  }, [load]);

  const dirty = seo != null && JSON.stringify(seo) !== saved;
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // what still stands between the site and a good search result
  const audit = useMemo(() => {
    if (!seo) return [];
    const live = books.filter((b) => b.status === "published" && !b.is_demo);
    const noCover = live.filter((b) => !b.cover_url);
    const shortDesc = live.filter((b) => !b.seo_description && (b.description ?? "").length < 80);
    return [
      { ok: !!seo.google_verification, text: "Сайт підтверджено в Google Search Console", fix: "вставте код нижче, у «Пошукових системах»" },
      { ok: !!seo.ga4_id || !!seo.gtm_id, text: "Підключено Google Analytics", fix: "додайте ID вимірювання G-…" },
      { ok: !!seo.og_image, text: "Є своя картинка для посилань у соцмережах", fix: "завантажте 1200×630 у «Загальному»" },
      { ok: Object.values(seo.social).some(Boolean), text: "Указано соцмережі (Google показує їх у картці видавництва)", fix: "додайте хоча б Instagram чи Telegram" },
      { ok: !!(seo.org.email || seo.org.phone), text: "Є контакти видавництва для розмітки schema.org", fix: "пошта або телефон у «Видавництві»" },
      { ok: noCover.length === 0, text: `Усі книги мають обкладинку${noCover.length ? ` (без обкладинки: ${noCover.length})` : ""}`, fix: "завантажте обкладинки в «Книгах»" },
      {
        ok: shortDesc.length === 0,
        text: `У книг є нормальний опис для пошуку${shortDesc.length ? ` (закороткий у ${shortDesc.length})` : ""}`,
        fix: "допишіть опис або SEO-опис у картці книги",
      },
      { ok: !seo.noindex, text: "Сайт відкритий для пошукових систем", fix: "зніміть «Сховати сайт» нижче" },
    ];
  }, [seo, books]);

  if (!seo) return <div className={s.empty}>{error || "Завантаження…"}</div>;

  const set = (patch: Partial<SeoSettings>) => setSeo({ ...seo, ...patch });
  const setPage = (key: string, f: "title" | "description", v: string) =>
    set({ pages: { ...seo.pages, [key]: { ...{ title: "", description: "" }, ...seo.pages[key], [f]: v } } });
  const setOrg = (k: keyof SeoSettings["org"], v: string) => set({ org: { ...seo.org, [k]: v } });
  const setSocial = (k: string, v: string) => set({ social: { ...seo.social, [k]: v } });

  async function save() {
    if (!seo) return;
    setBusy(true);
    setMsg("");
    setError("");
    try {
      const next = await saveSeo(token, seo);
      setSeo(next);
      setSaved(JSON.stringify(next));
      setMsg("Збережено. Аналітика діє вже зараз; заголовки, описи й коди підтвердження зʼявляться на сайті після наступного викладання.");
    } catch (e) {
      setError(fail(e));
    } finally {
      setBusy(false);
    }
  }

  const done = audit.filter((a) => a.ok).length;

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>SEO</h1>
          <p className={s.sub}>Як сайт виглядає в Google, соцмережах і месенджерах</p>
        </div>
        <div className={s.headActions}>
          {dirty && <span className={s.dim}>є незбережені зміни</span>}
          <button type="button" className={s.btnPrimary} disabled={busy || !dirty} onClick={save}>
            {busy ? "Зберігаємо…" : "Зберегти"}
          </button>
        </div>
      </div>
      {error && <p className={s.error}>{error}</p>}
      {msg && <p className={s.muted}>{msg}</p>}

      <Panel title="Перевірка" sub={`${done} з ${audit.length}`}>
        <ul className={s.miniList}>
          {audit.map((a) => (
            <li key={a.text} className={s.miniRow} style={{ gridTemplateColumns: "22px 1fr" }}>
              <span style={{ color: a.ok ? "var(--a-ok)" : "var(--a-warn)" }}>{a.ok ? "✓" : "•"}</span>
              <span>
                {a.text}
                {!a.ok && (
                  <>
                    <br />
                    <span className={s.dim}>{a.fix}</span>
                  </>
                )}
              </span>
            </li>
          ))}
        </ul>
        <span className={s.dim}>
          Книги отримують власні сторінки <b>/book/назва</b> з заголовком, описом, обкладинкою й розміткою для Google (ціна, наявність).
          SEO-поля кожної книги — в її картці в <Link href="books">«Книгах»</Link>.
        </span>
      </Panel>

      <Panel title="Загальне">
        <div className={s.formGrid}>
          <label className={s.field}>
            <span>Назва сайту</span>
            <input value={seo.site_name} onChange={(e) => set({ site_name: e.target.value })} />
          </label>
          <label className={s.field}>
            <span>Хвіст заголовка</span>
            <input value={seo.title_suffix} onChange={(e) => set({ title_suffix: e.target.value })} placeholder=" – ВІДЬМАР" />
          </label>
        </div>
        <label className={s.field}>
          <span style={{ display: "flex", justifyContent: "space-between" }}>
            Опис сайту за замовчуванням <Count n={seo.default_description.length} max={160} />
          </span>
          <textarea rows={2} value={seo.default_description} onChange={(e) => set({ default_description: e.target.value })} placeholder={PAGES[0].description} />
        </label>
        <label className={s.field}>
          <span>Ключові слова (через кому; Google їх ігнорує, але читають інші пошуковики)</span>
          <input value={seo.keywords} onChange={(e) => set({ keywords: e.target.value })} placeholder="езотерика, містика, відьомство, книги українською" />
        </label>
        <div className={p.gen}>
          <label className={s.field} style={{ flex: 1 }}>
            <span>Картинка для посилань у соцмережах і месенджерах (1200×630)</span>
            <input value={seo.og_image} onChange={(e) => set({ og_image: e.target.value })} placeholder="/og.jpg (зараз стандартна)" />
          </label>
          <label className={s.btn} style={{ cursor: "pointer" }}>
            Завантажити
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                try {
                  set({ og_image: await uploadImage(file) });
                } catch (err) {
                  setError(fail(err));
                } finally {
                  setBusy(false);
                }
              }}
            />
          </label>
        </div>
        {seo.og_image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={seo.og_image} alt="" style={{ width: 300, aspectRatio: "1200/630", objectFit: "cover", borderRadius: 8, border: "1px solid var(--a-line)" }} />
        )}
        <label className={s.check} style={{ alignItems: "flex-start" }}>
          <input type="checkbox" checked={seo.noindex} onChange={(e) => set({ noindex: e.target.checked })} />
          <span>
            Сховати сайт від пошукових систем
            <br />
            <span className={s.dim}>Лише на час розробки: сайт зникне з Google після наступного викладання.</span>
          </span>
        </label>
      </Panel>

      <Panel title="Сторінки" sub="порожнє поле = текст за замовчуванням">
        {PAGES.map((pg) => {
          const o = seo.pages[pg.key] ?? { title: "", description: "" };
          // the home page falls back to the site-wide description when one is set
          const def = pg.key === "home" && seo.default_description ? seo.default_description : pg.description;
          const t = o.title ? (o.title.includes(seo.site_name) ? o.title : o.title + seo.title_suffix) : pg.title;
          return (
            <div key={pg.key} className={p.pageCard}>
              <span className={s.strong}>{pg.label}</span>
              <div className={s.formGrid}>
                <label className={s.field}>
                  <span style={{ display: "flex", justifyContent: "space-between" }}>
                    Заголовок <Count n={t.length} max={60} />
                  </span>
                  <input value={o.title} onChange={(e) => setPage(pg.key, "title", e.target.value)} placeholder={pg.title} />
                </label>
                <label className={s.field}>
                  <span style={{ display: "flex", justifyContent: "space-between" }}>
                    Опис <Count n={(o.description || def).length} max={160} />
                  </span>
                  <textarea rows={2} value={o.description} onChange={(e) => setPage(pg.key, "description", e.target.value)} placeholder={def} />
                </label>
              </div>
              <SerpPreview title={t} description={o.description || def} url={SITE + pg.path} />
            </div>
          );
        })}
      </Panel>

      <div className={s.grid2}>
        <Panel title="Пошукові системи й аналітика">
          <label className={s.field}>
            <span>Google Search Console: код підтвердження</span>
            <input
              value={seo.google_verification}
              onChange={(e) => set({ google_verification: e.target.value.replace(/.*content="([^"]+)".*/, "$1").trim() })}
              placeholder='вставте весь тег <meta name="google-site-verification" …> або лише код'
            />
          </label>
          <label className={s.field}>
            <span>Bing Webmaster: код підтвердження</span>
            <input
              value={seo.bing_verification}
              onChange={(e) => set({ bing_verification: e.target.value.replace(/.*content="([^"]+)".*/, "$1").trim() })}
              placeholder="msvalidate.01"
            />
          </label>
          <label className={s.field}>
            <span>Google Analytics 4: ID вимірювання</span>
            <input value={seo.ga4_id} onChange={(e) => set({ ga4_id: e.target.value.trim() })} placeholder="G-XXXXXXXXXX" />
          </label>
          <label className={s.field}>
            <span>Google Tag Manager (за потреби)</span>
            <input value={seo.gtm_id} onChange={(e) => set({ gtm_id: e.target.value.trim() })} placeholder="GTM-XXXXXXX" />
          </label>
          <label className={s.field}>
            <span>Meta Pixel (Facebook / Instagram реклама)</span>
            <input value={seo.meta_pixel_id} onChange={(e) => set({ meta_pixel_id: e.target.value.replace(/\D/g, "") })} placeholder="числовий ID" />
          </label>
          <span className={s.dim}>Аналітика вмикається на сайті одразу після збереження. В адмінці вона не працює.</span>
        </Panel>

        <Panel title="Видавництво" sub="для розмітки schema.org">
          <div className={s.formGrid}>
            <label className={s.field}>
              <span>Юридична назва</span>
              <input value={seo.org.legal_name} onChange={(e) => setOrg("legal_name", e.target.value)} placeholder="ФОП … / ТОВ …" />
            </label>
            <label className={s.field}>
              <span>Рік заснування</span>
              <input value={seo.org.founded} onChange={(e) => setOrg("founded", e.target.value)} placeholder="2026" />
            </label>
            <label className={s.field}>
              <span>Пошта</span>
              <input value={seo.org.email} onChange={(e) => setOrg("email", e.target.value)} placeholder="hello@vidmar.com.ua" />
            </label>
            <label className={s.field}>
              <span>Телефон</span>
              <input value={seo.org.phone} onChange={(e) => setOrg("phone", e.target.value)} placeholder="+380…" />
            </label>
            <label className={s.field}>
              <span>Місто</span>
              <input value={seo.org.city} onChange={(e) => setOrg("city", e.target.value)} placeholder="Київ" />
            </label>
            <label className={s.field}>
              <span>Адреса (необовʼязково)</span>
              <input value={seo.org.address} onChange={(e) => setOrg("address", e.target.value)} />
            </label>
          </div>
          <label className={s.field}>
            <span>Логотип (квадратний, від 112×112)</span>
            <input value={seo.org.logo} onChange={(e) => setOrg("logo", e.target.value)} placeholder="/icon.png" />
          </label>
        </Panel>
      </div>

      <Panel title="Соцмережі">
        <div className={s.formGrid}>
          {SOCIAL.map((x) => (
            <label key={x.key} className={s.field}>
              <span>{x.label}</span>
              <input value={seo.social[x.key] ?? ""} onChange={(e) => setSocial(x.key, e.target.value.trim())} placeholder={x.ph} />
            </label>
          ))}
        </div>
      </Panel>
    </>
  );
}
