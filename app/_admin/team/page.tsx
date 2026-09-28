"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon, useAdmin } from "@/components/admin/AdminShell";
import Drawer from "@/components/admin/Drawer";
import s from "@/components/admin/admin.module.css";
import p from "@/components/admin/plus.module.css";
import { when } from "@/components/admin/labels";
import {
  createAdmin,
  deleteAdmin,
  listAdminSessions,
  listTeam,
  revokeAdminSession,
  unlockAdmin,
  type AdminSession,
  type TeamMember,
} from "@/lib/api";

const PLUS = "M12 5v14M5 12h14";

/** 20 characters from an alphabet with no look-alikes: easy to dictate, hard to guess */
function genPassword() {
  const abc = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const r = crypto.getRandomValues(new Uint32Array(20));
  const raw = Array.from(r, (n) => abc[n % abc.length]).join("");
  return raw.replace(/(.{5})(?!$)/g, "$1-");
}

function AddAdmin({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { token, fail } = useAdmin();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState(genPassword);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  return (
    <Drawer
      title="Новий адміністратор"
      sub="Повний доступ до адмінки. Передайте пароль особисто, не в загальному чаті."
      onClose={onClose}
      foot={
        done ? (
          <button type="button" className={s.btnPrimary} onClick={onClose}>
            Готово
          </button>
        ) : (
          <button
            type="button"
            className={s.btnPrimary}
            disabled={busy || login.length < 3 || password.length < 14}
            onClick={async () => {
              setBusy(true);
              setError("");
              try {
                await createAdmin(token, login.trim(), password);
                setDone(true);
                onDone();
              } catch (e) {
                setError(fail(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            Додати
          </button>
        )
      }
    >
      {error && <p className={s.error}>{error}</p>}
      {done ? (
        <div className={s.section}>
          <span className={s.sectionTitle}>Доступ створено</span>
          <dl className={s.dl}>
            <dt>Логін</dt>
            <dd className={p.code}>{login}</dd>
            <dt>Пароль</dt>
            <dd className={p.code}>{password}</dd>
          </dl>
          <button type="button" className={s.btn} onClick={() => navigator.clipboard?.writeText(`${login}\n${password}`)}>
            Скопіювати логін і пароль
          </button>
          <span className={s.dim}>Пароль більше ніде не показується. Після першого входу його варто змінити.</span>
        </div>
      ) : (
        <>
          <label className={s.field}>
            <span>Логін</span>
            <input value={login} onChange={(e) => setLogin(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))} placeholder="olena" autoFocus />
          </label>
          <div className={p.gen}>
            <label className={s.field} style={{ flex: 1 }}>
              <span>Пароль (мінімум 14 символів)</span>
              <input value={password} onChange={(e) => setPassword(e.target.value)} style={{ fontFamily: "ui-monospace, monospace" }} />
            </label>
            <button type="button" className={s.btn} onClick={() => setPassword(genPassword())}>
              Новий
            </button>
          </div>
        </>
      )}
    </Drawer>
  );
}

export default function TeamPage() {
  const { token, fail } = useAdmin();
  const [team, setTeam] = useState<TeamMember[] | null>(null);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(
    () =>
      Promise.all([listTeam(token), listAdminSessions(token)])
        .then(([t, ss]) => {
          setTeam(t);
          setSessions(ss);
          setError("");
        })
        .catch((e) => setError(fail(e))),
    [token, fail],
  );
  useEffect(() => {
    load();
  }, [load]);

  const act = (fn: () => Promise<unknown>) => async () => {
    try {
      await fn();
      load();
    } catch (e) {
      setError(fail(e));
    }
  };

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Команда</h1>
          <p className={s.sub}>Хто має доступ до адмінки і звідки зараз увійшли.</p>
        </div>
        <div className={s.headActions}>
          <button type="button" className={s.btnPrimary} onClick={() => setAdding(true)}>
            <Icon d={PLUS} size={16} /> Додати адміністратора
          </button>
        </div>
      </div>

      {error && <p className={s.error}>{error}</p>}

      <section className={s.panel} style={{ marginBottom: 18 }}>
        <div className={s.panelHead}>
          <h2 className={s.h2}>Адміністратори</h2>
          <span className={s.dim}>{team?.length ?? 0}</span>
        </div>
        <div className={s.tableWrap} style={{ border: 0 }}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Логін</th>
                <th className={s.hideSm}>Доданий</th>
                <th>Останній вхід</th>
                <th>Сесій</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(team ?? []).map((m) => {
                const locked = m.locked_until && new Date(m.locked_until) > new Date();
                return (
                  <tr key={m.id}>
                    <td>
                      <span className={s.strong}>{m.login}</span>
                      {m.me && <span className={p.me}>це ви</span>}
                      {locked && (
                        <>
                          <br />
                          <span className={p.failed}>заблоковано до {when(m.locked_until)}</span>
                        </>
                      )}
                      {!locked && m.failed > 0 && (
                        <>
                          <br />
                          <span className={s.dim}>невдалих спроб: {m.failed}</span>
                        </>
                      )}
                    </td>
                    <td className={`${s.hideSm} ${s.dim}`}>{when(m.created_at, false)}</td>
                    <td>
                      {when(m.last_login_at)}
                      <br />
                      <span className={`${s.dim} ${s.num}`}>{m.last_login_ip ?? ""}</span>
                    </td>
                    <td className={s.num}>{m.sessions}</td>
                    <td className={s.right}>
                      {locked && (
                        <button type="button" className={s.btnGhost} onClick={act(() => unlockAdmin(token, m.id))}>
                          Розблокувати
                        </button>
                      )}
                      {!m.me && (
                        <button
                          type="button"
                          className={s.btnGhost}
                          onClick={act(async () => {
                            if (confirm(`Забрати доступ у «${m.login}»? Усі його сесії завершаться одразу.`)) await deleteAdmin(token, m.id);
                          })}
                        >
                          Забрати доступ
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={s.panel}>
        <div className={s.panelHead}>
          <h2 className={s.h2}>Активні сесії</h2>
          <span className={s.dim}>вхід діє 12 годин</span>
        </div>
        <div className={s.tableWrap} style={{ border: 0 }}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Хто</th>
                <th>Увійшов</th>
                <th className={s.hideSm}>Діє до</th>
                <th>IP</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {sessions.map((x) => (
                <tr key={x.id}>
                  <td>
                    <span className={s.strong}>{x.login}</span>
                    {x.current && <span className={p.me}>цей браузер</span>}
                  </td>
                  <td>{when(x.created_at)}</td>
                  <td className={`${s.hideSm} ${s.dim}`}>{when(x.expires_at)}</td>
                  <td className={`${s.num} ${s.dim}`}>{x.ip}</td>
                  <td className={s.right}>
                    {!x.current && (
                      <button type="button" className={s.btnGhost} onClick={act(() => revokeAdminSession(token, x.id))}>
                        Завершити
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {adding && <AddAdmin onClose={() => setAdding(false)} onDone={load} />}
    </>
  );
}
