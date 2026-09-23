import Seal from "./Seal";
import styles from "./BookCover.module.css";

type Props = {
  title: string;
  author?: string | null;
  src?: string | null;
  pos?: string | null;
  /** big = the book page; small = cart rows */
  size?: "card" | "big" | "small";
};

/**
 * A cover built from a Doré plate plus a stamped title panel. Real covers
 * uploaded later replace the plate, and the panel stays off them: a real
 * cover already carries its own title.
 */
export default function BookCover({ title, author, src, pos, size = "card" }: Props) {
  const plate = !src || src.startsWith("/gravure/");
  return (
    <div className={`${styles.cover} ${styles[size]}`}>
      {src && (
        <img
          className={styles.img}
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ objectPosition: pos || "50% 50%" }}
        />
      )}
      <span className={styles.spine} aria-hidden="true" />
      {plate && size !== "small" && (
        <>
          <span className={styles.shade} aria-hidden="true" />
          <span className={styles.frame} aria-hidden="true" />
          <span className={styles.panel}>
            <span className={styles.star} aria-hidden="true">
              <Seal ticks={0} emblem />
            </span>
            <span className={styles.title}>{title}</span>
            {author && <span className={styles.author}>{author}</span>}
          </span>
        </>
      )}
    </div>
  );
}
