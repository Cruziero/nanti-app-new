import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const GMAIL_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";

export function gmailAdmin() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) throw new Error("Gmail storage is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function gmailConfig() {
  const clientId = process.env["GMAIL_CLIENT_ID"];
  const clientSecret = process.env["GMAIL_CLIENT_SECRET"];
  const redirectUri = process.env["GMAIL_REDIRECT_URI"];
  if (!clientId || !clientSecret || !redirectUri)
    throw new Error("Gmail connection is not configured on this deployment.");
  const redirect = new URL(redirectUri);
  if (
    redirect.pathname !== "/api/auth/gmail" ||
    redirect.search ||
    redirect.hash ||
    (redirect.protocol !== "https:" &&
      !(redirect.protocol === "http:" && redirect.hostname === "localhost"))
  ) {
    throw new Error("Gmail callback URL is invalid.");
  }
  encryptionKey();
  return { clientId, clientSecret, redirectUri, origin: redirect.origin };
}

function encryptionKey() {
  const key = Buffer.from(process.env["GMAIL_TOKEN_ENCRYPTION_KEY"] || "", "base64");
  if (key.length !== 32) throw new Error("Gmail token encryption is not configured.");
  return key;
}

export function sealToken(token: string, binding: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  cipher.setAAD(Buffer.from(binding));
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
}

export function openToken(value: string, binding: string) {
  const bytes = Buffer.from(value, "base64");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), bytes.subarray(0, 12));
  decipher.setAAD(Buffer.from(binding));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString("utf8");
}

export function sameState(expected: string, actual: string) {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function taskDedupeKey(email: string, messageId: string, title: string) {
  return createHash("sha256")
    .update(
      JSON.stringify([
        email.toLowerCase(),
        messageId,
        title.trim().replace(/\s+/g, " ").toLocaleLowerCase(),
      ]),
    )
    .digest("hex");
}

type MimePart = {
  mimeType?: string;
  filename?: string;
  body?: { data?: string; attachmentId?: string };
  parts?: MimePart[];
  headers?: { name: string; value: string }[];
};
export type GmailMessage = {
  id: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  payload?: MimePart;
};
export type EmailPreview = {
  id: string;
  subject: string;
  from: string;
  receivedAt: string | null;
  text: string;
  url: string;
};

function decodePart(part: MimePart): string {
  if (part.filename || part.body?.attachmentId) return "";
  const own = part.body?.data ? Buffer.from(part.body.data, "base64url").toString("utf8") : "";
  if (part.mimeType === "text/plain") return own;
  if (part.mimeType === "text/html")
    return own
      .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ");
  const parts = part.parts || [];
  if (part.mimeType === "multipart/alternative") {
    const plain = parts.find((p) => p.mimeType === "text/plain" && !p.filename);
    if (plain) return decodePart(plain);
  }
  return parts.map(decodePart).filter(Boolean).join("\n");
}

export function previewMessage(message: GmailMessage, email: string): EmailPreview {
  const headers = message.payload?.headers || [];
  const header = (name: string) => headers.find((h) => h.name.toLowerCase() === name)?.value || "";
  const timestamp = Number(message.internalDate);
  return {
    id: message.id,
    subject: (header("subject") || "(No subject)").slice(0, 500),
    from: header("from").slice(0, 500),
    receivedAt:
      message.internalDate && Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null,
    text: (message.payload ? decodePart(message.payload) : message.snippet || "").slice(0, 18000),
    url: `https://mail.google.com/mail/u/?authuser=${encodeURIComponent(email)}#all/${encodeURIComponent(message.id)}`,
  };
}

export async function ownedWorkspace(
  db: ReturnType<typeof gmailAdmin>,
  userId: string,
  workspaceId: string,
) {
  const { data, error } = await db
    .from("email_workspaces")
    .select("id,user_id,kind,name")
    .eq("id", workspaceId)
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("Email workspace is unavailable.");
  return data;
}

export async function ownedConnection(
  db: ReturnType<typeof gmailAdmin>,
  userId: string,
  workspaceId: string,
  connectionId: string,
) {
  await ownedWorkspace(db, userId, workspaceId);
  const { data, error } = await db
    .from("gmail_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("user_id", userId)
    .eq("workspace_id", workspaceId)
    .single();
  if (error || !data) throw new Error("Gmail connection is unavailable.");
  return data;
}

type GmailConnection = {
  id: string;
  user_id: string;
  workspace_id: string;
  email: string;
  status: string;
  refresh_token_encrypted: string;
};

export async function gmailAccessToken(
  db: ReturnType<typeof gmailAdmin>,
  connection: GmailConnection,
) {
  if (connection.status !== "connected")
    throw new Error("Reconnect this Gmail account to read emails.");
  const { clientId, clientSecret } = gmailConfig();
  const binding = `${connection.user_id}:${connection.workspace_id}:${connection.email}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: openToken(connection.refresh_token_encrypted, binding),
    }),
  });
  if (!response.ok) {
    const failure = await response.json().catch(() => ({}));
    if (failure.error === "invalid_grant") {
      const { error } = await db
        .from("gmail_connections")
        .update({ status: "reconnect_required" })
        .eq("id", connection.id)
        .eq("user_id", connection.user_id);
      if (error) throw new Error("Could not update Gmail connection status.");
    }
    throw new Error("Gmail access failed. Please try again or reconnect this account.");
  }
  const tokens = await response.json();
  if (!tokens.access_token) throw new Error("Gmail access failed.");
  return String(tokens.access_token);
}

export async function gmailRequest(
  db: ReturnType<typeof gmailAdmin>,
  connection: GmailConnection,
  path: string,
  suppliedToken?: string,
) {
  const token = suppliedToken || (await gmailAccessToken(db, connection));
  const result = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!result.ok)
    throw new Error(
      result.status === 404
        ? "This email is no longer available."
        : "Gmail could not load emails. Please try again.",
    );
  return result.json();
}
