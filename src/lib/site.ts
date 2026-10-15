const configured = import.meta.env.VITE_SITE_URL;

export const SITE_URL =
  (typeof configured === "string" && configured.trim()) || "https://nanti.site";

export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;

export function canonical(path: string) {
  return { rel: "canonical", href: `${SITE_URL}${path}` };
}
