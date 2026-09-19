import type { Metadata } from "next";
import { EMAIL, submissionNote, submissionRules } from "@/lib/content";
import Reveal from "@/components/Reveal";
import Seal from "@/components/Seal";
import Smoke from "@/components/Smoke";
import Atmosphere from "@/components/Atmosphere";
import PageHero from "@/components/PageHero";
import ScrollProgress from "@/components/ScrollProgress";
import { pageMeta } from "@/lib/seo";
import styles from "./submissions.module.css";

export const metadata: Metadata = pageMeta(
  "Авторам — ВІДЬМАР",
  "Умови прийому рукописів у видавництво ВІДЬМАР: що ми шукаємо і як надіслати текст.",
  "/submissions",
);

export default function SubmissionsPage() {
  return (
    <>
      <PageHero label="Авторам" title="Надіслати рукопис" lede="Ми вже відкриті до співпраці. Поки формуємо команду, розглядаємо максимально готові до друку рукописи." variant={3} />

      {/* the three conditions, set as large as the page allows */}
      <section className={`ash pad ${styles.rulesScene}`} data-field="light">
        <span className={styles.stamp} aria-hidden="true">
          <Seal />
        </span>
        <div className="wrapMax" style={{ position: "relative" }}>
          <Reveal>
            <span className="micro micro--bright">що ми просимо на першому етапі</span>
          </Reveal>

          <div className={styles.rules}>
            {submissionRules.map((rule, i) => (
              <Reveal key={rule} delay={i * 90}>
                <div className={styles.rule}>
                  <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={styles.ruleText}>{rule}</span>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <p className={`body ${styles.note}`}>{submissionNote}</p>
          </Reveal>
        </div>
      </section>

      {/* the address itself, at the centre of the ring on the stone */}
      <ScrollProgress className={styles.send} data-field="dark" data-candle="">
        <Atmosphere variant={4} watermark={false} />
        <Smoke intensity={0.85} source={[0.5, 0.02]} />
        <div className={styles.sendIn}>
          <div className={styles.sendRing} aria-hidden="true">
            <Seal star={false} />
          </div>
          <div className={styles.sendCopy}>
            <span className={styles.sendStar} aria-hidden="true">
              <Seal ticks={0} emblem />
            </span>
            <span className="micro">надсилайте рукопис на</span>
            <a className={styles.email} href={`mailto:${EMAIL}`}>
              {/* break only after the @, never inside a word */}
              {EMAIL.split("@")[0]}@<wbr />
              {EMAIL.split("@")[1]}
            </a>
            <p className={styles.sendNote}>
              Разом із рукописом додайте трохи інформації про себе. Будемо
              знайомитися!
            </p>
            <a className="pill pill--solid" href={`mailto:${EMAIL}`}>
              Написати листа
            </a>
          </div>
        </div>
      </ScrollProgress>
    </>
  );
}
