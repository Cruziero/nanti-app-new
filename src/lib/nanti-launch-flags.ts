function enabled(value: unknown) {
  return String(value || "").trim().toLowerCase() === "true";
}

export const NANTI_LAUNCH_FLAGS = {
  whatsapp: enabled(import.meta.env.VITE_WHATSAPP_LAUNCH_ENABLED),
  calendar: enabled(import.meta.env.VITE_CALENDAR_LAUNCH_ENABLED),
  push: enabled(import.meta.env.VITE_PUSH_LAUNCH_ENABLED),
} as const;

export type NantiIntegrationKey = keyof typeof NANTI_LAUNCH_FLAGS;

export function integrationStatusLabel(key: NantiIntegrationKey) {
  return NANTI_LAUNCH_FLAGS[key] ? "Available" : "Private beta";
}
