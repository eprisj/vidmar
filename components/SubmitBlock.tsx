import Link from "next/link";
import Reveal from "./Reveal";
import Seal from "./Seal";
import styles from "./SubmitBlock.module.css";

type Props = {
  title?: string;
  text?: string;
};

/**
 * The call to authors, on ash, with the seal pressed in as a blind stamp.
 *
 * One button, pointing at /submissions. It used to carry three routes to the
 * same act — the address as the primary button, a link to the conditions, and
 * the conditions themselves copied out beside it — while /submissions holds
 * the form, those same conditions and the address anyway. Everything except
 * the invitation now lives on that page alone.
 */
export default function SubmitBlock({
  title = "У вас є готовий рукопис?",
  // "Рукопис" is already in the heading above and on the button below, so the
  // line between them says "текст" instead of making it three in a row.
  text = "Надсилайте текст і кілька слів про себе – будемо знайомитися.",
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

        <Reveal>
          <div className={styles.body}>
            <h2 className="statement">{title}</h2>
            <p className="body" style={{ marginTop: 20 }}>
              {text}
            </p>
            <div className={styles.cta}>
              <Link className="pill pill--solid" href="/submissions">
                Надіслати рукопис
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
