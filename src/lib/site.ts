const configured = import.meta.env.VITE_SITE_URL;

export const SITE_URL = (typeof configured === "string" && configured.trim()) || "https://nanti-app-new.vercel.app";

export const OG_IMAGE_URL = `${SITE_URL}/og-image.png`;
