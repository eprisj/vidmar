import Link from "next/link";
import Atmosphere from "@/components/Atmosphere";
import Smoke from "@/components/Smoke";
import Seal from "@/components/Seal";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <section className={styles.root} data-field="dark" data-candle="">
      <Atmosphere variant={2} watermark={false} />
      <Smoke intensity={0.8} source={[0.5, 0.02]} />
      <div className={styles.in}>
        <div className={styles.ring} aria-hidden="true">
          <Seal star={false} />
        </div>
        <div className={styles.copy}>
          <span className={styles.code}>404</span>
          <p className={styles.text}>Цієї сторінки немає — або вона ще не написана.</p>
          <Link className="pill" href="/">
            На головну
          </Link>
        </div>
      </div>
    </section>
  );
}
