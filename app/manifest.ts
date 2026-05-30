import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             "Don Bosco Premier League",
    short_name:       "Don Bosco PL",
    description:      "Amatorska liga piłkarska",
    start_url:        "/",
    display:          "standalone",
    background_color: "#ffffff",
    theme_color:      "#18181b",
    icons: [
      { src: "/logo-cropped.png", sizes: "192x192", type: "image/png" },
      { src: "/logo-cropped.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
