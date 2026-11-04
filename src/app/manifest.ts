import type { MetadataRoute } from "next";

// Lets you "Add to Home screen" on your phone so it opens like an app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kudi Tracker",
    short_name: "Kudi",
    description: "Track every cedi you spend and earn.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ef4444",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
