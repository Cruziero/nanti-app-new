export type ItemKind = "task" | "commitment" | "deadline" | "waiting" | "followup";
export type ItemStatus = "inbox" | "open" | "done" | "ignored" | "received";
export type Priority = "high" | "medium" | "low";
export type SourceType = "paste" | "screenshot" | "demo" | "manual";

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
}

export interface Message {
  id: string;
  source: string;
  sender: string;
  text: string;
  at: string;
}
