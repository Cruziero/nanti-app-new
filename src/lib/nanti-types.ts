export type ItemKind = "task" | "commitment" | "deadline" | "waiting" | "followup" | "invoice";
export type ItemStatus = "inbox" | "open" | "done" | "ignored" | "received";
export type Priority = "critical" | "high" | "medium" | "low";
export type SourceType = "paste" | "screenshot" | "demo" | "manual" | "whatsapp" | "calendar";
export type ReminderChannel = "whatsapp" | "push" | "calendar" | "in_app";
export type ReminderIntensity = "gentle" | "normal" | "persistent";
export type ReminderStage = "preparation" | "due" | "checkin" | "overdue";
export type NotificationType =
  | "due_soon"
  | "due_today"
  | "overdue"
  | "waiting_too_long"
  | "potentially_forgotten"
  | "ai_clarification"
  | "followup_suggestion"
  | "daily_briefing"
  | "invoice_due";
export type NotificationStatus =
  "scheduled" | "sent" | "delivered" | "read" | "failed" | "cancelled";
export type ConversationTone =
  "formal" | "professional" | "casual" | "friendly" | "warm" | "loving" | "direct" | "custom";
export type AppLanguage = "indonesian" | "english" | "mix";
export type FocusArea = "work" | "business" | "personal" | "everything";
export type IntegrationStatus = "not_connected" | "connected" | "pending" | "failed";

export interface Person {
  id: string;
  name: string;
  org: string;
  role?: string | undefined;
  lastConversation: string; // ISO date
  activity: { date: string; text: string }[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  sources: string[];
}

export interface Item {
  id: string;
  title: string;
  description?: string | undefined;
  kind: ItemKind;
  status: ItemStatus;
  priority: Priority;
  due?: string | undefined; // ISO date
  time?: string | undefined; // HH:mm
  since?: string | undefined; // ISO date, for waiting items
  personId?: string | undefined;
  projectId?: string | undefined;
  /** Name detected by the AI when no person/project record matched. */
  personName?: string | undefined;
  projectName?: string | undefined;
  source: string; // WhatsApp group / chat name
  sourceType?: SourceType | undefined;
  quote: string;
  aiNote: string;
  confidence: number; // 0..1
  createdBy: "ai" | "user";
  createdAt?: string | undefined; // ISO timestamp
  // Reminder fields
  reminderEnabled?: boolean;
  reminderTime?: string | undefined; // ISO timestamp
  reminderChannels?: ReminderChannel[];
  reminderIntensity?: ReminderIntensity;
  lastRemindedAt?: string | undefined;
  reminderCount?: number;
  // Invoice fields
  invoiceId?: string | undefined;
}

export interface Message {
  id: string;
  source: string;
  sender: string;
  text: string;
  at: string;
}

// Reminder system types
export interface Reminder {
  id: string;
  itemId: string;
  userId: string;
  stage: ReminderStage;
  channel: ReminderChannel;
  scheduledAt: string; // ISO timestamp
  sentAt?: string;
  status: NotificationStatus;
  providerMessageId?: string;
  error?: string;
  idempotencyKey: string;
}

export interface ReminderConfig {
  itemId: string;
  dueDate: string;
  intensity: ReminderIntensity;
  channels: ReminderChannel[];
  preparationDays: number; // days before due to send preparation reminder
  customReminderTime?: string; // HH:mm
}

// User preferences
export interface UserPreferences {
  preferredName: string;
  language: AppLanguage;
  tone: ConversationTone;
  focusArea: FocusArea;
  emojiPreference: boolean;
  verbosity: "concise" | "normal" | "detailed";
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string; // HH:mm
}

export interface ReminderPreferences {
  channels: {
    whatsapp: boolean;
    push: boolean;
    calendar: boolean;
    inApp: boolean;
  };
  intensity: ReminderIntensity;
  defaultReminderTime: string; // HH:mm
  dailyBriefingTime: string; // HH:mm
  endOfDayTime: string; // HH:mm
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
}

// AI extraction structured output
export interface StructuredExtraction {
  type: ItemKind;
  title: string;
  person: string | null;
  org: string | null;
  what: string;
  when: string | null; // ISO date or natural language
  whenParsed: string | null; // ISO date if parsed
  action: string;
  owner: "me" | "other" | "unknown";
  priority: Priority;
  context: string;
  reminderRequired: boolean;
  confidence: number;
  needsClarification: boolean;
  missingFields: string[];
  sourceQuote: string;
  project?: string | null;
  dueTime?: string | undefined; // HH:mm
  // Invoice-specific
  amount?: number | undefined;
  currency?: string | undefined;
}

// Clarification flow
export interface ClarificationRequest {
  itemId?: string;
  type: "date" | "person" | "what" | "time" | "priority" | "confirmation";
  question: string;
  options?: { label: string; value: string }[];
  extracted?: Partial<StructuredExtraction>;
  originalText: string;
}

// Daily briefing
export interface DailyBriefing {
  date: string;
  greeting: string;
  summary: string;
  stats: {
    totalTasks: number;
    dueToday: number;
    overdue: number;
    waiting: number;
    calendarEvents: number;
  };
  priorities: string[];
  potentiallyForgotten: string[];
  calendarContext: string[];
}

// Invoice types
export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface Invoice {
  id: string;
  userId: string;
  invoiceNumber: string;
  clientId?: string;
  clientName: string;
  clientAddress?: string;
  businessName: string;
  businessAddress?: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  taxRate: number;
  total: number;
  currency: string;
  status: "draft" | "sent" | "viewed" | "due_soon" | "due_today" | "overdue" | "paid" | "cancelled";
  notes?: string;
  paymentDetails?: string;
  bankDetails?: string;
  logoUrl?: string;
  npwp?: string;
  poNumber?: string;
  template: "minimal" | "modern" | "premium";
  createdAt: string;
  updatedAt: string;
}

// Google Calendar
export interface CalendarConnection {
  id: string;
  userId: string;
  provider: "google";
  accessToken: string;
  refreshToken: string;
  calendarId: string;
  status: IntegrationStatus;
  connectedAt: string;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  connectionId: string;
  googleEventId?: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  itemId?: string; // linked NANTI commitment
  source: "google" | "nanti";
  syncedAt: string;
}

// WhatsApp integration
export interface WhatsAppConnection {
  id: string;
  userId: string;
  phoneNumber: string;
  phoneVerified: boolean;
  optIn: boolean;
  optedInAt?: string;
  optedOutAt?: string;
  messagingStatus: "active" | "inactive" | "template_required";
}

export interface WhatsAppMessage {
  id: string;
  userId: string;
  connectionId: string;
  messageId: string;
  direction: "inbound" | "outbound";
  type: "text" | "image" | "document" | "template";
  content: string;
  mediaUrl?: string;
  status: "sent" | "delivered" | "read" | "failed";
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
  error?: string;
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  channel: ReminderChannel;
  scheduledAt: string;
  sentAt?: string;
  readAt?: string;
  status: NotificationStatus;
  itemId?: string;
  metadata?: Record<string, unknown>;
}

// Push notification device
export interface NotificationDevice {
  id: string;
  userId: string;
  token: string;
  platform: "ios" | "android" | "web";
  enabled: boolean;
  lastSeen?: string;
}

// AI clarification log
export interface AiClarification {
  id: string;
  userId: string;
  itemId?: string;
  originalText: string;
  question: string;
  response?: string;
  resolved: boolean;
  createdAt: string;
}
