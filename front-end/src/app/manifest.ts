import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tech Masters Academy",
    short_name: "Tech Masters",
    description:
      "Internal desk for enquiries, admissions, fees, expenses and placements.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f4f1ea",
    theme_color: "#1b3350",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
