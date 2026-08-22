import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/webhooks/whatsapp")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");

        if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
          return new Response(challenge, { status: 200 });
        }

        return new Response("Forbidden", { status: 403 });
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json();

          if (body.object !== "whatsapp_business_account") {
            return new Response("OK", { status: 200 });
          }

          const entry = body.entry?.[0];
          const changes = entry?.changes?.[0];

          if (!changes) {
            return new Response("OK", { status: 200 });
          }

          if (changes.field === "messages") {
            const messages = changes.value?.messages;
            if (messages && messages.length > 0) {
              for (const message of messages) {
                await handleWhatsAppMessage({
                  from: message.from,
                  type: message.type,
                  text: message.text?.body,
                  image: message.image,
                  document: message.document,
                  timestamp: message.timestamp,
                  messageId: message.id,
                });
              }
            }
          }

          if (changes.field === "statuses") {
            const statuses = changes.value?.statuses;
            if (statuses && statuses.length > 0) {
              for (const status of statuses) {
                await handleWhatsAppStatus({
                  messageId: status.id,
                  status: status.status,
                  timestamp: status.timestamp,
                  recipientId: status.recipient_id,
                });
              }
            }
          }

          return new Response("OK", { status: 200 });
        } catch (error) {
          console.error("WhatsApp webhook error:", error);
          return new Response("OK", { status: 200 });
        }
      },
    },
  },
});

interface WhatsAppMessage {
  from: string;
  type: string;
  text?: string;
  image?: { id: string; mime_type: string; caption?: string };
  document?: { id: string; mime_type: string; filename: string; caption?: string };
  timestamp: string;
  messageId: string;
}

async function handleWhatsAppMessage(message: WhatsAppMessage) {
  const { from, type, text, image, document, timestamp, messageId } = message;

  console.log(`[WhatsApp] Received ${type} from ${from}`);

  const cleanNumber = from.replace(/\D/g, "");
  const normalized = cleanNumber.startsWith("62") ? `+${cleanNumber}` : `+62${cleanNumber}`;

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("phone_number", normalized)
    .single();

  if (!userData) {
    console.log(`[WhatsApp] No user found for phone ${normalized}`);
    return;
  }

  const userId = userData.id;

  await supabase.from("whatsapp_messages").insert({
    user_id: userId,
    direction: "inbound",
    phone_number: normalized,
    message_type: type,
    content: text || image?.caption || document?.caption || `[${type}]`,
    wa_message_id: messageId,
    timestamp: new Date(Number(timestamp) * 1000).toISOString(),
  });

  if (type === "text" && text) {
    const { data: consent } = await supabase
      .from("whatsapp_consent")
      .select("enabled")
      .eq("user_id", userId)
      .single();

    if (consent?.enabled) {
      const { data: existingConversations } = await supabase
        .from("conversations")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingConversations) {
        const newMessage = {
          role: "user" as const,
          content: text,
          createdAt: new Date().toISOString(),
        };

        await supabase.rpc("append_message", {
          p_id: existingConversations.id,
          p_message: JSON.stringify(newMessage),
        });
      }
    }
  }

  if (type === "document" && document) {
    await supabase.from("whatsapp_attachments").insert({
      user_id: userId,
      wa_message_id: messageId,
      file_name: document.filename,
      mime_type: document.mime_type,
      file_id: document.id,
    });
  }
}

interface WhatsAppStatus {
  messageId: string;
  status: string;
  timestamp: string;
  recipientId: string;
}

async function handleWhatsAppStatus(statusUpdate: WhatsAppStatus) {
  const { messageId, status, timestamp } = statusUpdate;

  console.log(`[WhatsApp] Status update for ${messageId}: ${status}`);

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );

  const statusMap: Record<string, string> = {
    sent: "sent",
    delivered: "delivered",
    read: "read",
    failed: "failed",
  };

  const mappedStatus = statusMap[status] || status;

  await supabase
    .from("whatsapp_messages")
    .update({
      status: mappedStatus,
      updated_at: new Date(Number(timestamp) * 1000).toISOString(),
    })
    .eq("wa_message_id", messageId);

  if (status === "failed") {
    console.log(`[WhatsApp] Message ${messageId} failed to deliver`);
  }
}
