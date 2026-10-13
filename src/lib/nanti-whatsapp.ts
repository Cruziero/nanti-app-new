import { createClient } from "@supabase/supabase-js";

function whatsappApiBase() {
  const version = process.env.WHATSAPP_GRAPH_VERSION || "v26.0";
  return `https://graph.facebook.com/${version}`;
}

function normalizeIndonesiaPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return `62${digits}`;
}

export async function sendWhatsAppMessage(
  to: string,
  message: string,
  phoneNumberId?: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const pid = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !pid) {
    return { success: false, error: "WhatsApp API not configured" };
  }

  const formatted = normalizeIndonesiaPhone(to);
  if (!formatted) {
    return { success: false, error: "Invalid WhatsApp phone number" };
  }

  try {
    const response = await fetch(`${whatsappApiBase()}/${pid}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formatted,
        type: "text",
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || "Failed to send message",
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string = "id",
  components?: unknown[],
  phoneNumberId?: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const pid = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !pid) {
    return { success: false, error: "WhatsApp API not configured" };
  }

  const formatted = normalizeIndonesiaPhone(to);
  if (!formatted) {
    return { success: false, error: "Invalid WhatsApp phone number" };
  }

  try {
    const response = await fetch(`${whatsappApiBase()}/${pid}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: formatted,
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode },
          components: components || [],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || "Failed to send template",
      };
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messages?.[0]?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function logOutboundMessage(
  userId: string,
  phoneNumber: string,
  messageType: string,
  content: string,
  waMessageId: string | undefined,
  status: "sent" | "delivered" | "read" | "failed",
): Promise<void> {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );

  await supabase.from("whatsapp_messages").insert({
    user_id: userId,
    direction: "outbound",
    to_number: normalizeIndonesiaPhone(phoneNumber),
    message_type: messageType,
    content,
    external_message_id: waMessageId,
    status,
  });
}

export async function updateMessageStatus(
  waMessageId: string,
  status: "sent" | "delivered" | "read" | "failed",
): Promise<void> {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  );

  await supabase
    .from("whatsapp_messages")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("external_message_id", waMessageId);
}
