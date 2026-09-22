import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { extractItems, type ExtractedItem } from "@/lib/nanti-ai.server";
import { parseSmartDate } from "@/lib/nanti-dates";
import { addDays, todayISO } from "@/lib/nanti-utils";

export const Route = createFileRoute("/api/webhooks/whatsapp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (
          mode === "subscribe" &&
          challenge &&
          token &&
          token === process.env.WHATSAPP_VERIFY_TOKEN
        ) {
          return new Response(challenge, { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
      },

      POST: async ({ request }) => {
        const rawBody = await request.text();
        const appSecret = process.env.WHATSAPP_APP_SECRET;
        if (!appSecret) {
          console.error("WhatsApp webhook rejected: WHATSAPP_APP_SECRET is missing");
          return new Response("Webhook not configured", { status: 503 });
        }
        if (!verifySignature(rawBody, request.headers.get("x-hub-signature-256"), appSecret)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let body: WhatsAppWebhook;
        try {
          body = JSON.parse(rawBody) as WhatsAppWebhook;
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        if (body.object !== "whatsapp_business_account") {
          return new Response("OK", { status: 200 });
        }

        try {
          for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
              if (change.field !== "messages") continue;
              for (const status of change.value?.statuses || []) {
                await handleStatus(status);
              }
              for (const message of change.value?.messages || []) {
                await handleMessage(message);
              }
            }
          }
        } catch (error) {
          console.error("WhatsApp webhook processing failed:", error);
          // Return 500 so Meta can retry transient failures. Message IDs make processing idempotent.
          return new Response("Retry", { status: 500 });
        }

        return new Response("OK", { status: 200 });
      },
    },
  },
});

type IncomingMessage = {
  id: string;
  from: string;
  timestamp?: string;
  type?: string;
  text?: { body?: string };
  image?: { id?: string; caption?: string; mime_type?: string };
  document?: { id?: string; caption?: string; filename?: string; mime_type?: string };
};

type StatusUpdate = {
  id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp?: string;
  errors?: Array<{ title?: string; message?: string }>;
};

type WhatsAppWebhook = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: {
        messages?: IncomingMessage[];
        statuses?: StatusUpdate[];
      };
    }>;
  }>;
};

function adminClient() {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !serviceKey) throw new Error("Supabase service credentials are missing");
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function verifySignature(rawBody: string, header: string | null, secret: string) {
  if (!header?.startsWith("sha256=")) return false;
  const receivedHex = header.slice("sha256=".length);
  if (!/^[a-f0-9]{64}$/i.test(receivedHex)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const received = Buffer.from(receivedHex, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function messageContent(message: IncomingMessage) {
  if (message.type === "text") return message.text?.body?.trim() || "";
  if (message.type === "image") return message.image?.caption?.trim() || "[image]";
  if (message.type === "document") return message.document?.caption?.trim() || "[document]";
  return `[${message.type || "unknown"}]`;
}

function clarificationType(item: ExtractedItem) {
  const first = item.missingFields?.[0]?.toLowerCase();
  if (first?.includes("person") || first?.includes("who")) return "person";
  if (first?.includes("time") || first?.includes("jam")) return "time";
  if (first?.includes("date") || first?.includes("when") || first?.includes("tanggal")) return "date";
  return "confirmation";
}

function extractedDate(item: ExtractedItem, original: string) {
  if (item.kind === "waiting") return { date: null, time: null };
  if (item.whenParsed) return { date: item.whenParsed, time: item.dueTime || null };
  if (item.when) {
    const parsed = parseSmartDate(item.when);
    if (parsed.date || parsed.time) {
      return { date: parsed.date, time: item.dueTime || parsed.time };
    }
  }
  if (typeof item.dueOffsetDays === "number") {
    return { date: addDays(todayISO(), item.dueOffsetDays), time: item.dueTime || null };
  }
  const parsed = parseSmartDate(original);
  return { date: parsed.date, time: item.dueTime || parsed.time };
}

function reminderAt(date: string | null, time: string | null) {
  if (!date) return null;
  const due = new Date(`${date}T${time || "09:00"}:00+07:00`);
  if (Number.isNaN(due.getTime())) return null;
  return new Date(due.getTime() - (time ? 60 * 60_000 : 0)).toISOString();
}

async function handleMessage(message: IncomingMessage) {
  if (!message.id || !message.from) return;

  const supabase = adminClient();
  const phone = normalizePhone(message.from);
  const content = messageContent(message);

  // Account linking deliberately works before a phone number is associated with a user.
  const linkMatch = /^\s*LINK\s+([A-Z0-9]{6,12})\s*$/i.exec(content);
  if (linkMatch) {
    const code = linkMatch[1]!.toUpperCase();
    const now = new Date().toISOString();
    const { data: link, error } = await supabase
      .from("whatsapp_user_links")
      .select("user_id,link_expires_at")
      .eq("link_code", code)
      .gt("link_expires_at", now)
      .maybeSingle();
    if (error) throw error;

    if (!link) {
      await sendText(message.from, "Kode link NANTI tidak valid atau sudah kedaluwarsa. Buat kode baru dari Settings.");
      return;
    }

    const { data: phoneOwner, error: phoneOwnerError } = await supabase
      .from("whatsapp_user_links")
      .select("user_id")
      .eq("phone_number", phone)
      .not("verified_at", "is", null)
      .maybeSingle();
    if (phoneOwnerError) throw phoneOwnerError;
    if (phoneOwner && phoneOwner.user_id !== link.user_id) {
      await sendText(
        message.from,
        "Nomor WhatsApp ini sudah terhubung ke akun NANTI lain. Putuskan koneksi lama dulu.",
      );
      return;
    }

    const { error: updateError } = await supabase
      .from("whatsapp_user_links")
      .update({
        phone_number: phone,
        verified_at: now,
        link_code: null,
        link_expires_at: null,
        updated_at: now,
      })
      .eq("user_id", link.user_id);
    if (updateError) throw updateError;

    const linkClaimed = await claimInboundMessage(supabase, link.user_id, message, content);
    if (linkClaimed) await updateMessageStatus(supabase, message.id, "processed");
    await supabase.from("product_events").insert({
      user_id: link.user_id,
      event_name: "whatsapp_connected",
      source: "whatsapp",
      properties: {},
    });
    await sendText(
      message.from,
      "NANTI sudah terhubung. Mulai sekarang kirim atau forward hal penting ke sini — saya akan bantu mengingatnya.",
    );
    return;
  }

  const { data: link, error: linkError } = await supabase
    .from("whatsapp_user_links")
    .select("user_id,pending_inbox_id")
    .eq("phone_number", phone)
    .not("verified_at", "is", null)
    .maybeSingle();
  if (linkError) throw linkError;
  if (!link) {
    // Do not retain unlinked conversation content.
    await sendText(message.from, 'Nomor ini belum terhubung ke NANTI. Buka Settings → WhatsApp, lalu kirim "LINK KODE".');
    return;
  }

  const claimed = await claimInboundMessage(supabase, link.user_id, message, content);
  if (!claimed) return; // Already processed, or another delivery is actively processing it.

  try {
    if (link.pending_inbox_id && message.type === "text" && content) {
      const resolved = await resolvePendingClarification(
        supabase,
        link.user_id,
        link.pending_inbox_id,
        content,
      );
      if (resolved) {
        await clearPendingClarification(supabase, link.user_id);
        await updateMessageStatus(supabase, message.id, "processed");
        await sendText(message.from, resolved);
        return;
      }
    }

    if (message.type !== "text" || !content) {
      await updateMessageStatus(supabase, message.id, "ignored");
      await sendText(message.from, "Untuk sekarang, kirim atau forward teks ke NANTI. Dukungan gambar dan dokumen akan menyusul.");
      return;
    }

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .upsert(
        {
          user_id: link.user_id,
          source: "WhatsApp",
          participant: phone,
          message_text: content.slice(0, 20000),
          source_external_id: message.id,
        },
        { onConflict: "user_id,source_external_id" },
      )
      .select("id")
      .single();
    if (conversationError) throw conversationError;

    const extraction = await extractItems(content, "WhatsApp");
    const created = [];
    let clarification: { id: string; question: string } | null = null;

    for (let index = 0; index < extraction.items.length; index++) {
      const item = extraction.items[index]!;
      const result = await persistExtractedItem(
        supabase,
        link.user_id,
        conversation.id,
        item,
        content,
        `${message.id}:${index}`,
      );
      created.push(result);
      if (result.entity === "inbox" && !clarification) {
        clarification = {
          id: result.id,
          question: result.question || "Mau NANTI simpan ini sebagai tugas?",
        };
      }
    }

    if (clarification) {
      await supabase
        .from("whatsapp_user_links")
        .update({ pending_inbox_id: clarification.id, updated_at: new Date().toISOString() })
        .eq("user_id", link.user_id);
    }

    await supabase.from("product_events").insert({
      user_id: link.user_id,
      event_name: "whatsapp_capture_processed",
      source: "whatsapp",
      properties: {
        detected_count: extraction.items.length,
        saved_count: created.length,
        needs_clarification: Boolean(clarification),
      },
    });
    await updateMessageStatus(supabase, message.id, "processed");

    if (!created.length) {
      await sendText(message.from, "Saya belum melihat hal yang perlu dijadikan tugas dari pesan itu.");
      return;
    }
    if (clarification) {
      await sendText(message.from, `Saya menangkap sesuatu yang penting. ${clarification.question}`);
      return;
    }

    const first = created[0];
    const suffix = created.length > 1 ? ` (+${created.length - 1} lainnya)` : "";
    await sendText(
      message.from,
      `✓ Tersimpan: ${first?.title || "hal penting"}${suffix}. Saya akan mengingatnya untukmu.`,
    );
  } catch (error) {
    await updateMessageStatus(
      supabase,
      message.id,
      "failed",
      error instanceof Error ? error.message.slice(0, 500) : "Processing failed",
    );
    throw error;
  }
}

async function claimInboundMessage(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  message: IncomingMessage,
  content: string,
) {
  const { data: existing, error: existingError } = await supabase
    .from("whatsapp_messages")
    .select("id,user_id,status,updated_at")
    .eq("external_message_id", message.id)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    if (existing.user_id !== userId) {
      throw new Error("WhatsApp message ID is already associated with another user.");
    }
    if (existing.status === "processed" || existing.status === "ignored") return false;
    if (existing.status === "processing") {
      const updatedAt = new Date(existing.updated_at || 0).getTime();
      if (Date.now() - updatedAt < 5 * 60_000) return false;
    }

    const { error } = await supabase
      .from("whatsapp_messages")
      .update({
        status: "processing",
        error: null,
        content: content.slice(0, 20000),
        raw_payload: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .eq("user_id", userId);
    if (error) throw error;
    return true;
  }

  const { error } = await supabase.from("whatsapp_messages").insert({
    user_id: userId,
    external_message_id: message.id,
    direction: "inbound",
    message_type: ["text", "image", "document"].includes(message.type || "")
      ? message.type
      : "unknown",
    content: content.slice(0, 20000),
    from_number: normalizePhone(message.from),
    status: "processing",
    raw_payload: message,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  return true;
}

async function updateMessageStatus(
  supabase: ReturnType<typeof adminClient>,
  messageId: string,
  status: "processed" | "ignored" | "failed",
  error?: string,
) {
  const { error: updateError } = await supabase
    .from("whatsapp_messages")
    .update({ status, error: error || null, updated_at: new Date().toISOString() })
    .eq("external_message_id", messageId);
  if (updateError) throw updateError;
}

async function persistExtractedItem(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  conversationId: string,
  item: ExtractedItem,
  original: string,
  sourceExternalId: string,
): Promise<{ entity: "task" | "waiting" | "inbox"; id: string; title: string; question?: string }> {
  const { date, time } = extractedDate(item, original);
  const needsClarification = Boolean(item.needsClarification) || item.confidence < 0.72;

  if (needsClarification) {
    const type = clarificationType(item);
    const question =
      item.clarifyingQuestion ||
      (item.kind === "waiting"
        ? "Kamu sedang menunggu siapa?"
        : "Mau NANTI simpan ini sebagai tugas?");
    const { data, error } = await supabase
      .from("inbox_items")
      .upsert({
        user_id: userId,
        source_external_id: sourceExternalId,
        type: item.kind,
        title: item.title,
        person_id: person?.id || null,
        project_id: project?.id || null,
        person_name: item.person,
        project_name: item.project,
        due_date: date,
        conversation_text: original.slice(0, 5000),
        source: "WhatsApp",
        source_type: "whatsapp",
        clarification_type: type,
        clarification_question: question,
        status: "pending",
      }, { onConflict: "user_id,source_external_id" })
.select("*")
      .single();
    if (error) throw error;
    return { entity: "inbox", id: data.id, title: data.title, question };
  }

  const person = item.person
    ? await resolvePersonAdmin(supabase, userId, item.person, item.org)
    : null;
  const project = item.project
    ? await resolveProjectAdmin(supabase, userId, item.project)
    : null;

  if (item.kind === "waiting") {
    const { data, error } = await supabase
      .from("waiting_items")
      .upsert({
        user_id: userId,
        source_external_id: sourceExternalId,
        title: item.title,
        person_name: item.person,
        project_name: item.project,
        status: "waiting",
        started_at: new Date().toISOString(),
        follow_up_at: new Date(Date.now() + 2 * 86400000).toISOString(),
        auto_follow_up_enabled: true,
        source: "WhatsApp",
        source_type: "whatsapp",
        quote: item.quote || original.slice(0, 2000),
        ai_note: item.aiNote || "",
        confidence: item.confidence,
        conversation_id: conversationId,
      }, { onConflict: "user_id,source_external_id" })
      .select("id,title")
      .single();
    if (error) throw error;
    if (person?.id) {
      await recordPersonActivityAdmin(supabase, {
        userId,
        personId: person.id,
        eventType: "captured",
        itemId: data.id,
        conversationId,
        summary: `Captured from WhatsApp: ${data.title}`,
        source: "WhatsApp",
        dedupeKey: `whatsapp:${sourceExternalId}:activity`,
        metadata: { kind: "waiting" },
      });
    }
    return { entity: "waiting", id: data.id, title: data.title };
  }

  const enableReminder = Boolean(date) || Boolean(item.reminderRequired);
  const { data, error } = await supabase
    .from("tasks")
    .upsert({
      user_id: userId,
      source_external_id: sourceExternalId,
      title: item.title,
      person_id: person?.id || null,
      project_id: project?.id || null,
      type: item.kind,
      status: "pending",
      priority: item.priority || "medium",
      due_date: date,
      time,
      person_name: item.person,
      project_name: item.project,
      source: "WhatsApp",
      source_type: "whatsapp",
      quote: item.quote || original.slice(0, 2000),
      ai_note: item.aiNote || "",
      confidence: item.confidence,
      conversation_id: conversationId,
      reminder_enabled: enableReminder,
      reminder_time: enableReminder ? reminderAt(date, time) : null,
      reminder_channels: enableReminder ? ["in_app", "push"] : [],
      reminder_intensity: "normal",
    }, { onConflict: "user_id,source_external_id" })
    .select("*")
    .single();
  if (error) throw error;
  if (person?.id) {
    await recordPersonActivityAdmin(supabase, {
      userId,
      personId: person.id,
      eventType: "captured",
      itemId: data.id,
      conversationId,
      summary: `Captured from WhatsApp: ${data.title}`,
      source: "WhatsApp",
      dedupeKey: `whatsapp:${sourceExternalId}:activity`,
      metadata: { kind: item.kind },
    });
  }
  return { entity: "task", id: data.id, title: data.title };
}

async function resolvePendingClarification(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  inboxId: string,
  answer: string,
) {
  const { data: inbox, error } = await supabase
    .from("inbox_items")
    .select("*")
    .eq("id", inboxId)
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();
  if (error) throw error;
  if (!inbox) return null;

  const lower = answer.trim().toLowerCase();
  if (
    inbox.clarification_type === "confirmation" &&
    /^(tidak|nggak|ga|gak|no|bukan)\b/.test(lower)
  ) {
    const { error: ignoreError } = await supabase
      .from("inbox_items")
      .update({ status: "ignored", updated_at: new Date().toISOString() })
      .eq("id", inbox.id)
      .eq("user_id", userId);
    if (ignoreError) throw ignoreError;
    return "Oke, saya abaikan. Itu tidak akan jadi tugas.";
  }

  if (
    inbox.clarification_type === "confirmation" &&
    !/^(ya|iya|yes|y|betul|benar|simpan|save)\b/.test(lower)
  ) {
    return 'Cukup jawab "ya" atau "tidak" untuk yang ini.';
  }

  const details: { personName?: string; due?: string; time?: string } = {};
  if (inbox.clarification_type === "person") {
    details.personName = answer.trim().slice(0, 200);
  }
  if (inbox.clarification_type === "date" || inbox.clarification_type === "time") {
    const parsed = parseSmartDate(answer);
    if (!parsed.date && !parsed.time) {
      return 'Saya belum menangkap waktunya. Contoh: "besok jam 10 pagi".';
    }
    details.due = parsed.date || undefined;
    details.time = parsed.time || undefined;
  }

  const promoted = await promoteInboxAdmin(supabase, userId, inbox, details);
  return promoted.kind === "waiting"
    ? `Siap. Saya catat kamu menunggu ${details.personName || inbox.person_name || "orang itu"}.`
    : `Siap. “${promoted.title}” sudah saya simpan.`;
}

async function promoteInboxAdmin(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  inbox: Record<string, any>,
  details: { personName?: string; due?: string; time?: string },
) {
  const personName = details.personName || inbox.person_name;
  const person = personName
    ? await resolvePersonAdmin(supabase, userId, personName, null)
    : null;
  const project = inbox.project_name
    ? await resolveProjectAdmin(supabase, userId, String(inbox.project_name))
    : null;

  if (inbox.type === "waiting") {
    const { data, error } = await supabase
      .from("waiting_items")
      .insert({
        user_id: userId,
        title: inbox.title,
        person_id: person?.id || null,
        project_id: project?.id || null,
        person_name: personName,
        project_name: inbox.project_name,
        status: "waiting",
        started_at: new Date().toISOString(),
        follow_up_at: new Date(Date.now() + 2 * 86400000).toISOString(),
        auto_follow_up_enabled: true,
        source: inbox.source || "WhatsApp",
        source_type: "whatsapp",
        quote: inbox.conversation_text || "",
        confidence: 0.8,
      })
      .select("id,title")
      .single();
    if (error) throw error;
    const { error: updateError } = await supabase
      .from("inbox_items")
      .update({ status: "tracked", updated_at: new Date().toISOString() })
      .eq("id", inbox.id)
      .eq("user_id", userId);
    if (updateError) throw updateError;
    if (person?.id) {
      await recordPersonActivityAdmin(supabase, {
        userId,
        personId: person.id,
        eventType: "captured",
        itemId: data.id,
        summary: `Clarified from WhatsApp: ${data.title}`,
        source: "WhatsApp",
        dedupeKey: `whatsapp:promoted:${inbox.id}`,
        metadata: { kind: "waiting" },
      });
    }
    return { ...data, kind: "waiting" };
  }

  const due = details.due || (inbox.due_date ? String(inbox.due_date).slice(0, 10) : null);
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title: inbox.title,
      person_id: person?.id || null,
      project_id: project?.id || null,
      type: inbox.type,
      status: "pending",
      priority: "medium",
      due_date: due,
      time: details.time || null,
      person_name: personName,
      project_name: inbox.project_name,
      source: inbox.source || "WhatsApp",
      source_type: "whatsapp",
      quote: inbox.conversation_text || "",
      confidence: 0.8,
      reminder_enabled: Boolean(due || details.time),
      reminder_time: due ? reminderAt(due, details.time || null) : null,
      reminder_channels: due || details.time ? ["in_app", "push"] : [],
      reminder_intensity: "normal",
    })
    .select("id,title")
    .single();
  if (error) throw error;

  const { error: updateError } = await supabase
    .from("inbox_items")
    .update({ status: "tracked", task_id: data.id, updated_at: new Date().toISOString() })
    .eq("id", inbox.id)
    .eq("user_id", userId);
  if (updateError) throw updateError;
  if (person?.id) {
    await recordPersonActivityAdmin(supabase, {
      userId,
      personId: person.id,
      eventType: "captured",
      itemId: data.id,
      summary: `Clarified from WhatsApp: ${data.title}`,
      source: "WhatsApp",
      dedupeKey: `whatsapp:promoted:${inbox.id}`,
      metadata: { kind: inbox.type },
    });
  }
  return { ...data, kind: inbox.type };
}

async function resolvePersonAdmin(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  name: string,
  company?: string | null,
) {
  const cleanName = name.trim().slice(0, 200);
  if (!cleanName) return null;

  const { data: existing, error: existingError } = await supabase
    .from("people")
    .select("*")
    .eq("user_id", userId)
    .ilike("name", cleanName)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;

  if (existing) {
    if (company && !existing.company) {
      const { data: updated, error } = await supabase
        .from("people")
        .update({ company: company.trim().slice(0, 200), updated_at: new Date().toISOString() })
        .eq("id", existing.id)
        .eq("user_id", userId)
        .select("*")
        .single();
      if (error) throw error;
      return updated;
    }
    return existing;
  }

  const { data, error } = await supabase
    .from("people")
    .insert({
      user_id: userId,
      name: cleanName,
      company: company?.trim().slice(0, 200) || null,
      last_conversation_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (!error) return data;
  if ((error as { code?: string }).code !== "23505") throw error;

  const { data: raced, error: racedError } = await supabase
    .from("people")
    .select("*")
    .eq("user_id", userId)
    .ilike("name", cleanName)
    .limit(1)
    .single();
  if (racedError) throw racedError;
  return raced;
}

async function resolveProjectAdmin(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
  name: string,
) {
  const cleanName = name.trim().slice(0, 200);
  if (!cleanName) return null;

  const { data: existing, error: existingError } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .ilike("name", cleanName)
    .limit(1)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from("projects")
    .insert({ user_id: userId, name: cleanName, description: "" })
    .select("*")
    .single();
  if (!error) return data;
  if ((error as { code?: string }).code !== "23505") throw error;

  const { data: raced, error: racedError } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .ilike("name", cleanName)
    .limit(1)
    .single();
  if (racedError) throw racedError;
  return raced;
}

async function recordPersonActivityAdmin(
  supabase: ReturnType<typeof adminClient>,
  input: {
    userId: string;
    personId: string;
    eventType: "captured" | "completed" | "followed_up" | "received" | "conversation" | "note";
    itemId?: string | null;
    conversationId?: string | null;
    summary: string;
    source?: string | null;
    dedupeKey?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  const occurredAt = new Date().toISOString();
  const { error } = await supabase.from("person_activity").insert({
    user_id: input.userId,
    person_id: input.personId,
    event_type: input.eventType,
    item_id: input.itemId ?? null,
    conversation_id: input.conversationId ?? null,
    summary: input.summary.slice(0, 1000),
    source: input.source ?? null,
    occurred_at: occurredAt,
    dedupe_key: input.dedupeKey ?? null,
    metadata: input.metadata ?? {},
  });
  if (error && (error as { code?: string }).code !== "23505") throw error;

  const { error: personError } = await supabase
    .from("people")
    .update({ last_conversation_at: occurredAt, updated_at: occurredAt })
    .eq("id", input.personId)
    .eq("user_id", input.userId);
  if (personError) throw personError;
}

async function clearPendingClarification(
  supabase: ReturnType<typeof adminClient>,
  userId: string,
) {
  const { error } = await supabase
    .from("whatsapp_user_links")
    .update({ pending_inbox_id: null, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (error) throw error;
}

async function handleStatus(status: StatusUpdate) {
  if (!status.id) return;
  const supabase = adminClient();
  const errorText = status.errors?.map((error) => error.message || error.title).filter(Boolean).join("; ");
  const { error } = await supabase
    .from("whatsapp_messages")
    .update({
      status: status.status,
      error: errorText || null,
      updated_at: status.timestamp
        ? new Date(Number(status.timestamp) * 1000).toISOString()
        : new Date().toISOString(),
    })
    .eq("external_message_id", status.id);
  if (error) throw error;
}

async function sendText(to: string, text: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const version = process.env.WHATSAPP_GRAPH_VERSION || "v26.0";
  if (!phoneNumberId || !accessToken) return false;

  const response = await fetch(
    `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: to.replace(/\D/g, ""),
        type: "text",
        text: { body: text.slice(0, 4096), preview_url: false },
      }),
    },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.error("WhatsApp send failed", response.status, detail.slice(0, 300));
    return false;
  }
  return true;
}
