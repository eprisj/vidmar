"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/components/admin/AdminShell";
import s from "@/components/admin/admin.module.css";
import p from "@/components/admin/plus.module.css";
import { when } from "@/components/admin/labels";
import {
  checkPayKeys,
  getSettings,
  listEmails,
  npCities,
  npSenders,
  npSync,
  npWarehouses,
  saveIntegrations,
  saveSetting,
  sendTestEmail,
  verifyMail,
  type Integrations,
  type PaymentSettings,
  type AdminSettings,
  type EmailRow,
  type MailKind,
  type NpCity,
  type NpSender,
  type NpWarehouse,
} from "@/lib/api";

const LETTERS: { k: MailKind; label: string; hint: string }[] = [
  { k: "created", label: "Замовлення оформлено", hint: "одразу після оформлення; з реквізитами, якщо оплата переказом" },
  { k: "paid", label: "Оплату отримано", hint: "після онлайн-оплати або коли ви ставите «Оплачено»; з посиланням на файли е-книг" },
  { k: "shipped", label: "Відправлено", hint: "з номером ТТН і посиланням на відстеження" },
  { k: "fulfilled", label: "Отримано", hint: "подяка й запрошення до каталогу" },
  { k: "cancelled", label: "Скасовано", hint: "коли замовлення скасовано" },
];

const MAIL_STATUS: Record<EmailRow["status"], { label: string; cls: string }> = {
  sent: { label: "надіслано", cls: s.s_paid },
  failed: { label: "помилка", cls: s.s_cancelled },
  skipped: { label: "не надіслано", cls: s.s_awaiting_payment },
};

function Toggle({ on, label, hint, onChange }: { on: boolean; label: string; hint?: string; onChange: (v: boolean) => void }) {
  return (
    <label className={s.check} style={{ alignItems: "flex-start", gap: 10 }}>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 3 }} />
      <span>
        {label}
        {hint && (
          <>
            <br />
            <span className={s.dim}>{hint}</span>
          </>
        )}
      </span>
    </label>
  );
}

/** the shop's own counterparty, contact, city and branch: what goes into "from" on every TTN */
function SenderPicker({ current, onSaved }: { current: NpSender | null; onSaved: () => void }) {
  const { token, fail } = useAdmin();
  const [list, setList] = useState<Awaited<ReturnType<typeof npSenders>> | null>(null);
  const [cp, setCp] = useState(current?.ref ?? "");
  const [contact, setContact] = useState(current?.contact_ref ?? "");
  const [phone, setPhone] = useState(current?.phone ?? "");
  const [cityQ, setCityQ] = useState(current?.city_name ?? "");
  const [cities, setCities] = useState<NpCity[]>([]);
  const [city, setCity] = useState<NpCity | null>(current ? { ref: current.city_ref, name: current.city_name, area: "" } : null);
  const [whs, setWhs] = useState<NpWarehouse[]>([]);
  const [wh, setWh] = useState(current?.warehouse_ref ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!city || cityQ.trim() === city.name) return;
    setCity(null);
  }, [cityQ, city]);
  useEffect(() => {
    if (city || cityQ.trim().length < 2) return setCities([]);
    const t = setTimeout(() => npCities(cityQ.trim()).then(setCities), 250);
    return () => clearTimeout(t);
  }, [cityQ, city]);
  useEffect(() => {
    if (city) npWarehouses(city.ref).then(setWhs);
  }, [city]);

  const cpObj = list?.find((x) => x.ref === cp);
  const contactObj = cpObj?.contacts.find((x) => x.ref === contact);

  return (
    <div className={s.section}>
      <span className={s.sectionTitle}>Відправник для нових ТТН</span>
      {current && (
        <p className={s.muted} style={{ margin: 0 }}>
          Зараз: <b>{current.name}</b>, {current.contact_name}, {current.phone} · {current.city_name}, {current.warehouse_name}
        </p>
      )}
      {error && <p className={s.error}>{error}</p>}
      {!list ? (
        <button
          type="button"
          className={s.btn}
          style={{ alignSelf: "flex-start" }}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              const x = await npSenders(token);
              setList(x);
              if (!cp && x[0]) setCp(x[0].ref);
            } catch (e) {
              setError(fail(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Питаємо Нову пошту…" : current ? "Змінити відправника" : "Обрати відправника з кабінету НП"}
        </button>
      ) : (
        <>
          <div className={s.formGrid}>
            <label className={s.field}>
              <span>Контрагент (ваш ФОП чи ви)</span>
              <select value={cp} onChange={(e) => (setCp(e.target.value), setContact(""))}>
                {list.map((x) => (
                  <option key={x.ref} value={x.ref}>
                    {x.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={s.field}>
              <span>Контактна особа</span>
              <select
                value={contact}
                onChange={(e) => {
                  setContact(e.target.value);
                  const c = cpObj?.contacts.find((x) => x.ref === e.target.value);
                  if (c?.phone) setPhone(c.phone);
                }}
              >
                <option value="">— оберіть —</option>
                {cpObj?.contacts.map((x) => (
                  <option key={x.ref} value={x.ref}>
                    {x.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={s.field}>
              <span>Телефон відправника</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="380XXXXXXXXX" />
            </label>
            <label className={s.field}>
              <span>Місто відправлення</span>
              <input value={cityQ} onChange={(e) => setCityQ(e.target.value)} placeholder="Київ" />
              {!city && cities.length > 0 && (
                <span className={s.row} style={{ gap: 6 }}>
                  {cities.slice(0, 6).map((c) => (
                    <button
                      key={c.ref}
                      type="button"
                      className={s.btnGhost}
                      onClick={() => {
                        setCity(c);
                        setCityQ(c.name);
                        setWh("");
                      }}
                    >
                      {c.name}
                      {c.area ? `, ${c.area}` : ""}
                    </button>
                  ))}
                </span>
              )}
            </label>
          </div>
          {city && (
            <label className={s.field}>
              <span>Відділення, з якого відправляєте</span>
              <select value={wh} onChange={(e) => setWh(e.target.value)}>
                <option value="">— оберіть —</option>
                {whs.map((w) => (
                  <option key={w.ref} value={w.ref}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <button
            type="button"
            className={s.btnPrimary}
            style={{ alignSelf: "flex-start" }}
            disabled={busy || !cpObj || !contactObj || !phone || !city || !wh}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                const sender: NpSender = {
                  ref: cpObj!.ref,
                  name: cpObj!.name,
                  contact_ref: contactObj!.ref,
                  contact_name: contactObj!.name,
                  phone: phone.replace(/\D/g, ""),
                  city_ref: city!.ref,
                  city_name: city!.name,
                  warehouse_ref: wh,
                  warehouse_name: whs.find((w) => w.ref === wh)?.name ?? "",
                };
                await saveSetting(token, "np", { sender });
                setList(null);
                onSaved();
              } catch (e) {
                setError(fail(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Зберегти відправника
          </button>
        </>
      )}
    </div>
  );
}

/** A one-line verdict under a "Перевірити" button: green when the bank or the mail server said yes. */
function Verdict({ r }: { r: { ok: boolean; error?: string; note?: string; name?: string | null } | null }) {
  if (!r) return null;
  return (
    <span className={`${s.pill} ${r.ok ? s.s_paid : s.s_cancelled}`} style={{ whiteSpace: "normal", textAlign: "left" }}>
      {r.ok ? `працює${r.name ? ` · ${r.name}` : ""}${r.note ? ` · ${r.note}` : ""}` : r.error}
    </span>
  );
}

const SOURCE = { admin: "з адмінки", env: "з файлу .env на сервері" } as const;

/* How buyers pay: each method on or off, its keys, the transfer requisites. A
   method appears at checkout only when it is on AND has what it needs, and the
   pills at the top say exactly what a buyer sees right now. */
function PaymentsPanel({ st, onSaved }: { st: AdminSettings; onSaved: () => void }) {
  const { token, fail } = useAdmin();
  const v = st.values.payments;
  const blank = { ...v, mono_token: "", liqpay_private_key: "" };
  const [f, setF] = useState<PaymentSettings>(blank);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [check, setCheck] = useState<Record<string, { ok: boolean; error?: string; name?: string | null } | null>>({});
  const set = (k: keyof PaymentSettings) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const on = st.pay.enabled;

  async function save(extra: Record<string, unknown> = {}) {
    setBusy(true);
    setMsg("");
    setError("");
    try {
      await saveSetting(token, "payments", { ...f, ...extra });
      setF((x) => ({ ...x, mono_token: "", liqpay_private_key: "" }));
      setMsg("Збережено. На сайті діє протягом хвилини, перезапуск не потрібен.");
      onSaved();
    } catch (e) {
      setError(fail(e));
    } finally {
      setBusy(false);
    }
  }
  async function probe(provider: "mono" | "liqpay") {
    setCheck((c) => ({ ...c, [provider]: null }));
    try {
      const r = await checkPayKeys(token, {
        provider,
        mono_token: f.mono_token,
        liqpay_public_key: f.liqpay_public_key !== v.liqpay_public_key ? f.liqpay_public_key : "",
        liqpay_private_key: f.liqpay_private_key,
      });
      setCheck((c) => ({ ...c, [provider]: r }));
    } catch (e) {
      setCheck((c) => ({ ...c, [provider]: { ok: false, error: fail(e) } }));
    }
  }
  // a switch saves itself alone, never the half-typed keys around it
  const flag = (k: "mono_enabled" | "liqpay_enabled" | "iban_enabled" | "cod_enabled" | "liqpay_sandbox") => async (x: boolean) => {
    setF((y) => ({ ...y, [k]: x }));
    setError("");
    try {
      await saveSetting(token, "payments", { [k]: x });
      onSaved();
    } catch (e) {
      setError(fail(e));
    }
  };
  const status = (id: keyof typeof on, label: string) => (
    <span className={`${s.pill} ${on[id] ? s.s_paid : s.s_fulfilled}`}>
      {label}: {on[id] ? "на сайті" : "вимкнено"}
    </span>
  );

  return (
    <section className={s.panel} style={{ marginBottom: 18 }}>
      <div className={s.panelHead}>
        <h2 className={s.h2}>Оплата</h2>
        <span className={s.dim}>ключі зберігаються на сервері й показуються лише останніми 4 символами</span>
      </div>
      <div className={s.panelBody} style={{ display: "grid", gap: 16 }}>
        <div className={s.row}>
          {status("mono", "monobank")}
          {status("liqpay", "LiqPay")}
          {status("iban", "Переказ на рахунок")}
          {status("cod", "Накладений платіж")}
        </div>
        {error && <p className={s.error}>{error}</p>}
        {msg && <p className={s.muted}>{msg}</p>}

        <span className={s.sectionTitle}>Карткою через monobank</span>
        <Toggle on={f.mono_enabled} label="Показувати на сайті" hint="зʼявиться, щойно збережено токен" onChange={flag("mono_enabled")} />
        <div className={s.row} style={{ alignItems: "flex-end" }}>
          <label className={s.field} style={{ flex: "1 1 320px" }}>
            <span>
              Токен інтернет-еквайрингу{" "}
              {v.mono_token ? <span className={s.dim}>(збережено {v.mono_token}{st.pay.source.mono ? `, ${SOURCE[st.pay.source.mono]}` : ""})</span> : null}
            </span>
            <input
              type="password"
              value={f.mono_token}
              onChange={set("mono_token")}
              autoComplete="off"
              placeholder={v.mono_token ? "залиште порожнім, щоб не змінювати" : "web.monobank.ua → Еквайринг → Налаштування → Токен"}
            />
          </label>
          <button type="button" className={s.btnGhost} onClick={() => probe("mono")} disabled={!f.mono_token && !v.mono_token && st.pay.source.mono !== "env"}>
            Перевірити
          </button>
        </div>
        <Verdict r={check.mono ?? null} />

        <span className={s.sectionTitle}>Карткою або Privat24 через LiqPay</span>
        <Toggle on={f.liqpay_enabled} label="Показувати на сайті" hint="зʼявиться, щойно збережено обидва ключі" onChange={flag("liqpay_enabled")} />
        <div className={s.formGrid}>
          <label className={s.field}>
            <span>Публічний ключ</span>
            <input value={f.liqpay_public_key} onChange={set("liqpay_public_key")} autoComplete="off" placeholder="i00000000000" />
          </label>
          <label className={s.field}>
            <span>
              Приватний ключ {v.liqpay_private_key ? <span className={s.dim}>(збережено {v.liqpay_private_key})</span> : null}
            </span>
            <input
              type="password"
              value={f.liqpay_private_key}
              onChange={set("liqpay_private_key")}
              autoComplete="off"
              placeholder={v.liqpay_private_key ? "залиште порожнім, щоб не змінювати" : "liqpay.ua → Налаштування → API"}
            />
          </label>
        </div>
        <div className={s.row} style={{ alignItems: "center" }}>
          <button type="button" className={s.btnGhost} onClick={() => probe("liqpay")}>
            Перевірити ключі
          </button>
          <Verdict r={check.liqpay ?? null} />
        </div>
        <Toggle
          on={f.liqpay_sandbox}
          label="Тестовий режим LiqPay"
          hint="оплати не списуються, але замовлення позначаються оплаченими. Лише для перевірки, потім вимкніть"
          onChange={flag("liqpay_sandbox")}
        />

        <span className={s.sectionTitle}>Переказ на рахунок</span>
        <Toggle on={f.iban_enabled} label="Показувати на сайті" hint="зʼявиться, щойно вказано IBAN; реквізити підуть у лист покупцю" onChange={flag("iban_enabled")} />
        <div className={s.formGrid}>
          <label className={s.field}>
            <span>IBAN</span>
            <input value={f.iban} onChange={set("iban")} placeholder="UA00 0000 0000 0000 0000 0000 0000 0" autoComplete="off" />
          </label>
          <label className={s.field}>
            <span>Отримувач</span>
            <input value={f.recipient} onChange={set("recipient")} placeholder="ФОП Прізвище Імʼя По батькові" />
          </label>
          <label className={s.field}>
            <span>ЄДРПОУ / ІПН</span>
            <input value={f.edrpou} onChange={set("edrpou")} inputMode="numeric" />
          </label>
          <label className={s.field}>
            <span>Банк</span>
            <input value={f.bank} onChange={set("bank")} placeholder="АТ «Універсал Банк»" />
          </label>
        </div>
        {f.iban && !/^UA\d{27}$/.test(f.iban.replace(/\s+/g, "").toUpperCase()) && (
          <span className={p.failed}>Український IBAN – це UA і 27 цифр. Перевірте, чи нічого не пропущено.</span>
        )}

        <span className={s.sectionTitle}>Накладений платіж</span>
        <Toggle
          on={f.cod_enabled}
          label="Показувати на сайті"
          hint="оплата при отриманні на Новій пошті; лише для паперових книг"
          onChange={flag("cod_enabled")}
        />

        <div className={s.row}>
          <button type="button" className={s.btnPrimary} disabled={busy} onClick={() => save()}>
            {busy ? "Зберігаємо…" : "Зберегти оплату"}
          </button>
          {v.mono_token && st.pay.source.mono === "admin" && (
            <button type="button" className={s.btnGhost} disabled={busy} onClick={() => confirm("Видалити збережений токен monobank?") && save({ clear_mono_token: true })}>
              Видалити токен monobank
            </button>
          )}
          {v.liqpay_private_key && (
            <button type="button" className={s.btnGhost} disabled={busy} onClick={() => confirm("Видалити збережений приватний ключ LiqPay?") && save({ clear_liqpay_private_key: true })}>
              Видалити ключ LiqPay
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

/** mail and Nova Poshta keys, typed in here instead of the server's .env */
function IntegrationsPanel({ values, onSaved }: { values: Integrations; onSaved: () => void }) {
  const { token, fail } = useAdmin();
  const [f, setF] = useState<Integrations>({ ...values, smtp_pass: "", np_api_key: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const set = (k: keyof Integrations) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const presets: Record<string, { host: string; port: string }> = {
    "Google Workspace / Gmail": { host: "smtp.gmail.com", port: "465" },
    "Zoho Mail": { host: "smtp.zoho.eu", port: "465" },
    "Ukr.net": { host: "smtp.ukr.net", port: "465" },
    "Mailgun (EU)": { host: "smtp.eu.mailgun.org", port: "465" },
    "Brevo": { host: "smtp-relay.brevo.com", port: "587" },
  };
  async function save(extra: Record<string, unknown> = {}) {
    setBusy(true);
    setMsg("");
    setError("");
    try {
      const next = await saveIntegrations(token, { ...f, ...extra });
      setF({ ...next, smtp_pass: "", np_api_key: "" });
      setMsg("Збережено. Діє одразу, перезапуск не потрібен.");
      onSaved();
    } catch (e) {
      setError(fail(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className={s.panel} style={{ marginBottom: 18 }}>
      <div className={s.panelHead}>
        <h2 className={s.h2}>Інтеграції</h2>
        <span className={s.dim}>ключі й паролі зберігаються на сервері і більше ніде не показуються</span>
      </div>
      <div className={s.panelBody} style={{ display: "grid", gap: 14 }}>
        {error && <p className={s.error}>{error}</p>}
        {msg && <p className={s.muted}>{msg}</p>}
        <span className={s.sectionTitle}>Пошта магазину (SMTP)</span>
        <div className={s.row}>
          {Object.entries(presets).map(([name, x]) => (
            <button key={name} type="button" className={s.btnGhost} onClick={() => setF({ ...f, smtp_host: x.host, smtp_port: x.port })}>
              {name}
            </button>
          ))}
        </div>
        <div className={s.formGrid}>
          <label className={s.field}>
            <span>SMTP-сервер</span>
            <input value={f.smtp_host} onChange={set("smtp_host")} placeholder="smtp.gmail.com" />
          </label>
          <label className={s.field}>
            <span>Порт</span>
            <input value={f.smtp_port} onChange={set("smtp_port")} placeholder="465" inputMode="numeric" />
          </label>
          <label className={s.field}>
            <span>Логін</span>
            <input value={f.smtp_user} onChange={set("smtp_user")} placeholder="shop@vidmar.com.ua" autoComplete="off" />
          </label>
          <label className={s.field}>
            <span>Пароль {values.smtp_pass ? <span className={s.dim}>(збережено {values.smtp_pass})</span> : null}</span>
            <input
              type="password"
              value={f.smtp_pass}
              onChange={set("smtp_pass")}
              placeholder={values.smtp_pass ? "залиште порожнім, щоб не змінювати" : "пароль застосунку"}
              autoComplete="new-password"
            />
          </label>
          <label className={s.field}>
            <span>Від кого</span>
            <input value={f.mail_from} onChange={set("mail_from")} placeholder="ВІДЬМАР <shop@vidmar.com.ua>" />
          </label>
          <label className={s.field}>
            <span>Відповіді на адресу (необовʼязково)</span>
            <input value={f.mail_reply_to} onChange={set("mail_reply_to")} placeholder="hello@vidmar.com.ua" />
          </label>
        </div>
        <span className={s.dim}>
          Для Gmail/Google Workspace потрібен «пароль застосунку» (Акаунт Google → Безпека → Паролі застосунків), звичайний пароль не
          підійде. Після збереження надішліть тестовий лист у блоці «Листи покупцям».
        </span>
        <span className={s.sectionTitle}>Нова пошта</span>
        <label className={s.field}>
          <span>Ключ API {values.np_api_key ? <span className={s.dim}>(збережено {values.np_api_key})</span> : null}</span>
          <input
            type="password"
            value={f.np_api_key}
            onChange={set("np_api_key")}
            placeholder={values.np_api_key ? "залиште порожнім, щоб не змінювати" : "з кабінету НП: Налаштування → Безпека → API-ключ"}
            autoComplete="off"
          />
        </label>
        <div className={s.row}>
          <button type="button" className={s.btnPrimary} disabled={busy} onClick={() => save()}>
            {busy ? "Зберігаємо…" : "Зберегти інтеграції"}
          </button>
          {values.smtp_pass && (
            <button type="button" className={s.btnGhost} disabled={busy} onClick={() => confirm("Видалити збережений пароль SMTP?") && save({ clear_smtp_pass: true })}>
              Видалити пароль SMTP
            </button>
          )}
          {values.np_api_key && (
            <button type="button" className={s.btnGhost} disabled={busy} onClick={() => confirm("Видалити збережений ключ Нової пошти?") && save({ clear_np_api_key: true })}>
              Видалити ключ НП
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const { token, fail } = useAdmin();
  const [st, setSt] = useState<AdminSettings | null>(null);
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [testTo, setTestTo] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mailCheck, setMailCheck] = useState<{ ok: boolean; error?: string; note?: string } | null>(null);

  const load = useCallback(
    () =>
      Promise.all([getSettings(token), listEmails(token)])
        .then(([a, b]) => {
          setSt(a);
          setEmails(b);
        })
        .catch((e) => setError(fail(e))),
    [token, fail],
  );
  useEffect(() => {
    load();
  }, [load]);

  const flip = (key: "mail" | "np", k: string) => async (v: boolean | number) => {
    try {
      await saveSetting(token, key, { [k]: v });
      load();
    } catch (e) {
      setError(fail(e));
    }
  };

  const saveMailText = async (k: string, v: string) => {
    try {
      await saveSetting(token, "mail", { [k]: v });
      setMsg(v ? `Сповіщення про замовлення підуть на ${v}.` : "Сповіщення магазину вимкнено.");
      load();
    } catch (e) {
      setError(fail(e));
    }
  };

  if (!st) return <div className={s.empty}>{error || "Завантаження…"}</div>;
  const m = st.mail;
  const np = st.values.np;

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Налаштування</h1>
          <p className={s.sub}>Оплата, листи, Нова пошта й ключі – усе, що раніше жило лише у файлі на сервері</p>
        </div>
      </div>
      {error && <p className={s.error}>{error}</p>}
      {msg && <p className={s.muted}>{msg}</p>}

      <div className={s.grid2}>
        <section className={s.panel}>
          <div className={s.panelHead}>
            <h2 className={s.h2}>Листи покупцям</h2>
            <span className={`${s.pill} ${m.configured ? s.s_paid : s.s_awaiting_payment}`}>
              {m.configured ? (m.mode === "log" ? "тестовий режим" : "пошта працює") : "пошта не налаштована"}
            </span>
          </div>
          <div className={s.panelBody} style={{ display: "grid", gap: 14 }}>
            {!m.configured && (
              <div className={s.note}>
                Листи поки не надсилаються, лише записуються в журнал нижче. Бракує: {m.missing.join(", ")}. Заповніть блок «Інтеграції»
                нижче.
              </div>
            )}
            {m.configured && m.from && (
              <span className={s.dim}>
                Відправник: <b>{m.from}</b>
                {m.host && m.mode === "smtp" ? ` · ${m.host}` : ""}
              </span>
            )}
            {m.configured && m.mode === "smtp" && (
              <div className={s.row} style={{ alignItems: "center" }}>
                <button
                  type="button"
                  className={s.btnGhost}
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setMailCheck(null);
                    try {
                      setMailCheck(await verifyMail(token));
                    } catch (e) {
                      setMailCheck({ ok: false, error: fail(e) });
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Перевірити підключення
                </button>
                <Verdict r={mailCheck} />
              </div>
            )}
            {LETTERS.map((l) => (
              <Toggle key={l.k} on={st.values.mail[l.k]} label={l.label} hint={l.hint} onChange={flip("mail", l.k)} />
            ))}
            <span className={s.sectionTitle}>Копія магазину</span>
            <label className={s.field}>
              <span>Надсилати сповіщення про замовлення на</span>
              <input
                type="email"
                defaultValue={st.values.mail.shop_email}
                placeholder="orders@vidmar.com.ua – порожньо, щоб не надсилати"
                onBlur={(e) => e.target.value.trim() !== st.values.mail.shop_email && saveMailText("shop_email", e.target.value.trim())}
              />
            </label>
            <Toggle on={st.values.mail.shop_created} label="Нове замовлення" hint="одразу після оформлення: книги, покупець, доставка, оплата" onChange={flip("mail", "shop_created")} />
            <Toggle on={st.values.mail.shop_paid} label="Надійшла оплата" hint="після онлайн-оплати або коли ви ставите «Оплачено»" onChange={flip("mail", "shop_paid")} />
            <div className={p.gen}>
              <label className={s.field} style={{ flex: 1 }}>
                <span>Надіслати тестовий лист на</span>
                <input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" />
              </label>
              <button
                type="button"
                className={s.btn}
                disabled={busy || !testTo || !m.configured}
                onClick={async () => {
                  setBusy(true);
                  setMsg("");
                  setError("");
                  try {
                    await sendTestEmail(token, testTo);
                    setMsg(`Тестовий лист надіслано на ${testTo}.`);
                  } catch (e) {
                    setError(fail(e));
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Надіслати
              </button>
            </div>
          </div>
        </section>

        <section className={s.panel}>
          <div className={s.panelHead}>
            <h2 className={s.h2}>Нова пошта</h2>
            <span className={`${s.pill} ${st.np_key ? s.s_paid : s.s_cancelled}`}>{st.np_key ? "ключ API є" : "немає ключа API"}</span>
          </div>
          <div className={s.panelBody} style={{ display: "grid", gap: 14 }}>
            <Toggle
              on={np.autosync}
              label="Відстежувати посилки автоматично"
              hint="кожні 30 хвилин: «в дорозі» → Відправлено, «отримано» → Виконано (+ листи покупцю)"
              onChange={flip("np", "autosync")}
            />
            <Toggle
              on={np.ttn_ships}
              label="ТТН означає «Відправлено»"
              hint="щойно для оплаченого чи накладеного замовлення вказано ТТН"
              onChange={flip("np", "ttn_ships")}
            />
            <Toggle
              on={np.auto_fulfilled}
              label="«Отримано» на Новій пошті закриває замовлення"
              hint="для накладеного платежу заодно ставить дату оплати"
              onChange={flip("np", "auto_fulfilled")}
            />
            <label className={s.field} style={{ maxWidth: 260 }}>
              <span>Вага однієї книги, якщо в картці не вказано, г</span>
              <input
                type="number"
                min={50}
                defaultValue={np.default_weight_g}
                onBlur={(e) => Number(e.target.value) !== np.default_weight_g && flip("np", "default_weight_g")(Number(e.target.value))}
              />
            </label>
            {st.np_key ? (
              <>
                <SenderPicker current={np.sender} onSaved={load} />
                <button
                  type="button"
                  className={s.btnGhost}
                  style={{ alignSelf: "flex-start" }}
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setMsg("");
                    try {
                      const r = await npSync(token);
                      setMsg(`Перевірено посилок: ${r.checked}, оновлено статусів: ${r.updated}, замовлень переведено: ${r.moved}.`);
                    } catch (e) {
                      setError(fail(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Оновити статуси посилок зараз
                </button>
              </>
            ) : (
              <div className={s.note}>Додайте ключ API з особистого кабінету Нової пошти в блоці «Інтеграції» нижче.</div>
            )}
          </div>
        </section>
      </div>

      <PaymentsPanel st={st} onSaved={load} />

      <IntegrationsPanel values={st.values.integrations} onSaved={load} />

      <section className={s.panel}>
        <div className={s.panelHead}>
          <h2 className={s.h2}>Журнал листів</h2>
          <span className={s.dim}>останні {emails.length}</span>
        </div>
        <div className={s.tableWrap} style={{ border: 0 }}>
          {emails.length === 0 ? (
            <div className={s.empty}>Листів ще не було.</div>
          ) : (
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Коли</th>
                  <th>Кому</th>
                  <th>Тема</th>
                  <th>Стан</th>
                </tr>
              </thead>
              <tbody>
                {emails.map((e) => (
                  <tr key={e.id}>
                    <td className={`${s.dim} ${s.num}`}>{when(e.created_at)}</td>
                    <td>
                      {e.to_email}
                      <br />
                      <span className={s.dim}>{e.created_by}</span>
                    </td>
                    <td>
                      {e.subject}
                      {e.error && (
                        <>
                          <br />
                          <span className={p.failed}>{e.error}</span>
                        </>
                      )}
                    </td>
                    <td>
                      <span className={`${s.pill} ${MAIL_STATUS[e.status].cls}`}>{MAIL_STATUS[e.status].label}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
