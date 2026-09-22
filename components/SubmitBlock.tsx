import Link from "next/link";
import { EMAIL, submissionRules } from "@/lib/content";
import Reveal from "./Reveal";
import Seal from "./Seal";
import styles from "./SubmitBlock.module.css";

type Props = {
  title?: string;
  text?: string;
  /** hide the "conditions" link when already on the conditions page */
  withConditionsLink?: boolean;
};

/** The call to authors, on ash, with the seal pressed in as a blind stamp. */
export default function SubmitBlock({
  title = "У вас є готовий рукопис?",
  text = "На першому етапі ми розглядаємо максимально готові до друку тексти. Надсилайте рукопис та інформацію про себе – будемо знайомитися.",
  withConditionsLink = true,
}: Props) {
  return (
    <section className={`ash pad ${styles.root}`} data-field="light">
      <span className={styles.seal} aria-hidden="true">
        <Seal />
      </span>
      <div className="wrapMax" style={{ position: "relative" }}>
        <Reveal>
          <span className="micro micro--bright">для авторів</span>
        </Reveal>

        <div className={styles.grid}>
          <Reveal>
            <div>
              <h2 className="statement">{title}</h2>
              <p className="body" style={{ marginTop: 20 }}>
                {text}
              </p>
              <div className={styles.cta}>
                <a className="pill pill--solid" href={`mailto:${EMAIL}`}>
                  {EMAIL}
                </a>
                {withConditionsLink && (
                  <Link className="pill pill--bare" href="/submissions">
                    Умови прийому
                  </Link>
                )}
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className={styles.rules}>
              {submissionRules.map((r) => (
                <div key={r} className={styles.rule}>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
