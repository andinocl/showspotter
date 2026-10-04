import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShowSpotter",
    short_name: "ShowSpotter",
    description: "Concerts for the bands you love, within the distance you choose.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0b12",
    theme_color: "#0b0b12",
    // TODO(milestone 7): add 192/512 PNG icons and an apple-touch-icon.
    icons: [],
  };
}
