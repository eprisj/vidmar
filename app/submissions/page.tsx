import type { Metadata } from "next";
import {
  EMAIL,
  focusText,
  submissionNote,
  submissionRules,
} from "@/lib/content";
import Reveal from "@/components/Reveal";
import Seal from "@/components/Seal";
import { pageMeta } from "@/lib/seo";
import styles from "./submissions.module.css";

export const metadata: Metadata = pageMeta(
  "Авторам — ВІДЬМАР",
  "Умови прийому рукописів у видавництво ВІДЬМАР: що ми шукаємо і як надіслати текст.",
  "/submissions",
);

export default function SubmissionsPage() {
  return (
    <section className="ash" data-field="light">
      <div className={`wrapMax ${styles.head}`}>
        <span className={styles.headMark}>
          <Seal />
        </span>
        <p className="micro">Авторам</p>
        <h1 className={styles.title}>Надіслати рукопис</h1>
        <p className={`body ${styles.lede}`}>{focusText}</p>
      </div>

      <div className="wrapMax">
        <div className={styles.grid}>
          <Reveal>
            <div>
              <p className="micro" style={{ marginBottom: 16 }}>
                Що ми просимо на першому етапі
              </p>
              <div className={styles.rules}>
                {submissionRules.map((rule) => (
                  <div key={rule} className={styles.rule}>
                    <span className={styles.mark} aria-hidden="true" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
              <p className="body" style={{ marginTop: 24 }}>{submissionNote}</p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className={styles.card}>
              <p className="micro micro--bright">Надсилайте на</p>
              <a className={styles.email} href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
              <p className="body">
                Разом із рукописом додайте трохи інформації про себе. Будемо
                знайомитися!
              </p>
              <a className="pill pill--solid" href={`mailto:${EMAIL}`}>
                Написати листа
              </a>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
