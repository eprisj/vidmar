"use client";

import { useEffect, useState } from "react";
import { fileSize, getPublicBookFiles, publicFileUrl, type PublicFile } from "@/lib/api";
import styles from "./book.module.css";

/** files the admin marked «Усім»: a free fragment, a press kit, a reading guide */
export default function BookMaterials({ slug }: { slug: string }) {
  const [files, setFiles] = useState<PublicFile[]>([]);
  useEffect(() => {
    let live = true;
    getPublicBookFiles(slug).then((f) => live && setFiles(f));
    return () => {
      live = false;
    };
  }, [slug]);
  if (!files.length) return null;
  return (
    <div className={`${styles.section} ${styles.materials}`}>
      <h2 className={styles.h2}>Матеріали</h2>
      <ul>
        {files.map((f) => (
          <li key={f.id}>
            <a href={publicFileUrl(f.id)} target={f.mime === "application/pdf" ? "_blank" : undefined} rel="noopener">
              <span className={styles.materialName}>{f.label || f.name}</span>
              <span className={styles.materialMeta}>
                {(f.name.split(".").pop() || "").toUpperCase()} · {fileSize(f.size)}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
