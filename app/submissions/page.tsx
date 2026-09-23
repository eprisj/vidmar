import type { Metadata } from "next";
import { EMAIL, submissionNote, submissionRules } from "@/lib/content";
import Reveal from "@/components/Reveal";
import Atmosphere from "@/components/Atmosphere";
import PageHero from "@/components/PageHero";
import SubmissionForm from "@/components/SubmissionForm";
import { pageMeta } from "@/lib/seo";
import styles from "./submissions.module.css";

export const metadata: Metadata = pageMeta(
  "Авторам – ВІДЬМАР",
  "Умови прийому рукописів у видавництво ВІДЬМАР: що ми шукаємо і як надіслати текст.",
  "/submissions",
);

/**
 * One screen of substance: what we ask for, and the form beside it.
 *
 * This used to run close to four screens – a full hero, the three conditions
 * set as display type on their own light scene, then a full-height smoke
 * scene around the form – for three short lines and five fields. It also said
 * "надіслати рукопис" three times, and asked for the manuscript in the
 * conditions while the form asked for only a description.
 */
export default function SubmissionsPage() {
  return (
    <>
      <PageHero
        label="Авторам"
        title="Надіслати рукопис"
        lede="Ми читаємо кожен рукопис, що надходить."
        variant={3}
        compact
      />

      <section className={`ink padS ${styles.scene}`} data-field="dark" data-candle="">
        <Atmosphere variant={4} watermark={false} />
        <div className={`wrapMax ${styles.grid}`}>
          <Reveal className={styles.terms}>
            <span className="micro micro--bright">що потрібно</span>
            <ol className={styles.rules}>
              {submissionRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
            <p className={styles.note}>{submissionNote}</p>
          </Reveal>

          <Reveal className={styles.send} delay={90}>
            <p className={styles.sendNote}>
              Опис і посилання на текст – повний рукопис попросимо, якщо
              зацікавимось.
            </p>
            <SubmissionForm />
            <p className={styles.sendNote}>
              Або на пошту:{" "}
              <a className={styles.email} href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
