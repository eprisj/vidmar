"use client";

import { useEffect, useState } from "react";
import { npCities, npWarehouses, type NpCity, type NpWarehouse } from "@/lib/api";
import styles from "./NovaPoshta.module.css";

function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export /** +380 67 123 45 67, typed however the buyer likes */
function formatPhone(raw: string) {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0")) d = "38" + d;
  if (d && !d.startsWith("380")) return raw.startsWith("+") ? raw : "+" + d;
  d = d.slice(0, 12);
  const parts = [d.slice(0, 3), d.slice(3, 5), d.slice(5, 8), d.slice(8, 10), d.slice(10, 12)].filter(Boolean);
  return d ? "+" + parts.join(" ") : "";
}

export default /** City by typing, then a branch from that city's list, both straight from
 * Nova Poshta through our API. */
function NovaPoshta({
  city,
  setCity,
  warehouse,
  setWarehouse,
}: {
  city: NpCity | null;
  setCity: (c: NpCity | null) => void;
  warehouse: NpWarehouse | null;
  setWarehouse: (w: NpWarehouse | null) => void;
}) {
  const [cityQ, setCityQ] = useState("");
  const [cities, setCities] = useState<NpCity[]>([]);
  const [open, setOpen] = useState(false);
  const [whQ, setWhQ] = useState("");
  const [whs, setWhs] = useState<NpWarehouse[]>([]);
  const dq = useDebounced(cityQ);
  const dw = useDebounced(whQ);

  useEffect(() => {
    if (city || dq.trim().length < 2) return setCities([]);
    npCities(dq).then(setCities);
  }, [dq, city]);

  useEffect(() => {
    if (!city) return setWhs([]);
    npWarehouses(city.ref, dw).then(setWhs);
  }, [city, dw]);

  return (
    <div className={styles.np}>
      <div className={styles.field}>
        <span className={styles.label}>Місто</span>
        {city ? (
          <span className={styles.picked}>
            <span>
              {city.name} <small>{city.area} обл.</small>
            </span>
            <button
              type="button"
              onClick={() => {
                setCity(null);
                setWarehouse(null);
                setCityQ("");
              }}
            >
              змінити
            </button>
          </span>
        ) : (
          <span className={styles.combo}>
            <input
              value={cityQ}
              onChange={(e) => {
                setCityQ(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Почніть вводити, напр. Вінниця"
              autoComplete="address-level2"
              aria-label="Місто"
            />
            {open && cities.length > 0 && (
              <ul className={styles.options} role="listbox">
                {cities.map((c) => (
                  <li key={c.ref}>
                    <button
                      type="button"
                      onClick={() => {
                        setCity(c);
                        setOpen(false);
                      }}
                    >
                      {c.name} <small>{c.area} обл.</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </span>
        )}
      </div>

      {city && (
        <div className={styles.field}>
          <span className={styles.label}>Відділення або поштомат</span>
          {warehouse ? (
            <span className={styles.picked}>
              <span>{warehouse.name}</span>
              <button type="button" onClick={() => setWarehouse(null)}>
                змінити
              </button>
            </span>
          ) : (
            <span className={styles.combo}>
              <input
                value={whQ}
                onChange={(e) => setWhQ(e.target.value)}
                placeholder="Номер або вулиця"
                aria-label="Відділення або поштомат"
              />
              <ul className={`${styles.options} ${styles.optionsStatic}`} role="listbox">
                {whs.map((w) => (
                  <li key={w.ref}>
                    <button type="button" onClick={() => setWarehouse(w)}>
                      {w.name}
                    </button>
                  </li>
                ))}
                {whs.length === 0 && <li className={styles.empty}>Нічого не знайшлось</li>}
              </ul>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

