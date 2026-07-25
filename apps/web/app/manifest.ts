import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Alize — AI app builder",
    short_name: "Alize",
    description:
      "Describe it. Ship it. A free, in-browser AI app builder. BYOK, local-first, no login.",
    start_url: "/builder",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0a0a0f",
    theme_color: "#7c3aed",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
