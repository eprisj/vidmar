import type { MetadataRoute } from "next";

export const dynamic = "force-static";

/** Home-screen icon and colours: the gold seal on the house night blue. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ВІДЬМАР – видавництво",
    short_name: "ВІДЬМАР",
    start_url: "/",
    display: "standalone",
    background_color: "#0b162b",
    theme_color: "#162e59",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
