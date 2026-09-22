import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type {
  Item,
  Person,
  Project,
  ReminderChannel,
  ReminderIntensity,
  ConversationTone,
  AppLanguage,
  FocusArea,
} from "./nanti-types";
import { demoItems, demoPeople, demoProjects, dayOffset } from "./nanti-demo";
import { addDays, normalizeDay, todayISO } from "./nanti-utils";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import {
  fetchProjects,
  fetchPeople,
  fetchPersonActivity,
  fetchTasks,
  fetchWaitingItems,
  fetchInboxItems,
  createTask as createTaskFn,
  updateTask as updateTaskFn,
  deleteTask as deleteTaskFn,
  createWaitingItem as createWaitingItemFn,
  updateWaitingItem as updateWaitingItemFn,
  deleteWaitingItem as deleteWaitingItemFn,
  createInboxItem as createInboxItemFn,
  updateInboxItem as updateInboxItemFn,
  promoteInboxItem as promoteInboxItemFn,
  resolvePersonMemory,
  resolveProjectMemory,
  markWaitingFollowedUp as markWaitingFollowedUpFn,
  logProductEvent,
  logPersonActivity,
  createConversation as createConversationFn,
  seedDemoData,
  fetchUserSettings,
  upsertUserSettings,
} from "./nanti-supabase";

const KEY = "nanti.state.v1";

export interface Settings {
  name: string;
  briefingTime: string;
  endOfDayTime: string;
  notifications: Record<string, boolean>;
  onboarded: boolean;
  role?: string;
  volume?: string;
  // New preference fields
  language: AppLanguage;
  tone: ConversationTone;
  focusArea: FocusArea;
  preferredName: string;
  emojiPreference: boolean;
  verbosity: "concise" | "normal" | "detailed";
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  reminderChannels: ReminderChannel[];
  reminderIntensity: ReminderIntensity;
  // Integration status
  whatsappConnected: boolean;
  calendarConnected: boolean;
}

interface State {
  items: Item[];
  people: Person[];
  projects: Project[];
  settings: Settings;
  generatedOn?: string;
}

const defaultSettings: Settings = {
  name: "Rizky",
  briefingTime: "08:00",
  endOfDayTime: "17:30",
  notifications: {
    "Tugas jatuh tempo": true,
    "Tugas terlambat": true,
    "Menunggu terlalu lama": true,
    "Insight baru dari NANTI": true,
    "Briefing harian": true,
    "Sapuan akhir hari": true,
  },
  onboarded: false,
  language: "indonesian",
  tone: "professional",
  focusArea: "everything",
  preferredName: "Rizky",
  emojiPreference: true,
  verbosity: "normal",
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  reminderChannels: ["in_app", "push"],
  reminderIntensity: "normal",
  whatsappConnected: false,
  calendarConnected: false,
};

const emptyState: State = { items: [], people: [], projects: [], settings: defaultSettings };

function freshState(): State {
  return {
    items: demoItems(),
    people: demoPeople(),
    projects: demoProjects(),
    settings: defaultSettings,
    generatedOn: todayISO(),
  };
}

const isDemoItem = (id: string) => /^i\d+$/.test(id) || /^w\d+$/.test(id) || /^n\d+$/.test(id);
const isDemoPerson = (id: string) => id.startsWith("p-");

function rebase(state: State): State {
  const today = todayISO();
  const from = normalizeDay(state.generatedOn);
  const shift = from
    ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000)
    : 0;

  const move = (value: string | undefined, demo: boolean) => {
    const day = normalizeDay(value);
    if (!day) return undefined;
    return demo && shift ? addDays(day, shift) : day;
  };

  return {
    ...state,
    generatedOn: today,
    items: (state.items ?? []).map((i) => {
      const demo = isDemoItem(i.id);
      const due = move(i.due, demo);
      const since = move(i.since, demo);
      const next: Item = { ...i };
      if (due) next.due = due;
      else delete next.due;
      if (since) next.since = since;
      else delete next.since;
      return next;
    }),
    people: (state.people ?? []).map((p) => {
      const demo = isDemoPerson(p.id);
      return {
        ...p,
        lastConversation: move(p.lastConversation, demo) ?? todayISO(),
        activity: (p.activity ?? []).map((a) => ({
          ...a,
          date: move(a.date, demo) ?? todayISO(),
        })),
      };
    }),
  };
}

// Map Supabase task to app Item
function taskToItem(task: Record<string, unknown>): Item {
  return {
    id: task.id as string,
    title: task.title as string,
    description: (task.description as string) || undefined,
    kind: task.type as Item["kind"],
    status: task.status === "pending" ? "open" : task.status === "completed" ? "done" : "ignored",
    priority: task.priority as Item["priority"],
    due: (task.due_date as string)?.slice(0, 10),
    time: (task.time as string) || undefined,
    personId: (task.person_id as string) || undefined,
    projectId: (task.project_id as string) || undefined,
    personName: (task.person_name as string) || undefined,
    projectName: (task.project_name as string) || undefined,
    source: (task.source as string) || "",
    sourceType: (task.source_type as Item["sourceType"]) || undefined,
    quote: (task.quote as string) || "",
    aiNote: (task.ai_note as string) || "",
    confidence: typeof task.confidence === "number" ? task.confidence : 0.8,
    memoryStrength: 1.0,
    createdBy: "ai",
    createdAt: task.created_at as string,
    reminderEnabled: (task.reminder_enabled as boolean) || false,
    reminderTime: (task.reminder_time as string) || undefined,
    reminderChannels: (task.reminder_channels as ReminderChannel[]) || [],
    reminderIntensity: (task.reminder_intensity as ReminderIntensity) || undefined,
    lastRemindedAt: (task.last_reminded_at as string) || undefined,
    reminderCount: (task.reminder_count as number) || 0,
    semanticContext:
      task.semantic_context && typeof task.semantic_context === "object"
        ? (task.semantic_context as Item["semanticContext"])
        : undefined,
  };
}

// Map Supabase waiting_item to app Item
function waitingToItem(item: Record<string, unknown>): Item {
  return {
    id: item.id as string,
    title: item.title as string,
    kind: "waiting",
    status: item.status === "received" ? "received" : "open",
    priority: "medium",
    since: (item.started_at as string)?.slice(0, 10),
    personId: (item.person_id as string) || undefined,
    projectId: (item.project_id as string) || undefined,
    personName: (item.person_name as string) || undefined,
    projectName: (item.project_name as string) || undefined,
    source: (item.source as string) || "",
    sourceType: (item.source_type as Item["sourceType"]) || undefined,
    quote: (item.quote as string) || "",
    aiNote: (item.ai_note as string) || "",
    confidence: typeof item.confidence === "number" ? item.confidence : 0.8,
    memoryStrength: 1.0,
    createdBy: "ai",
    createdAt: item.created_at as string,
    followUpAt: (item.follow_up_at as string) || undefined,
    lastFollowedUpAt: (item.last_followed_up_at as string) || undefined,
    followUpCount: (item.follow_up_count as number) || 0,
    autoFollowUpEnabled: item.auto_follow_up_enabled !== false,
    semanticContext:
      item.semantic_context && typeof item.semantic_context === "object"
        ? (item.semantic_context as Item["semanticContext"])
        : undefined,
  };
}

// Map Supabase inbox_item to app Item
function inboxToItem(item: Record<string, unknown>): Item {
  return {
    id: item.id as string,
    title: item.title as string,
    kind: item.type as Item["kind"],
    status: "inbox",
    priority: "medium",
    due: (item.due_date as string)?.slice(0, 10),
    personName: (item.person_name as string) || undefined,
    projectName: (item.project_name as string) || undefined,
    source: (item.source as string) || "",
    sourceType: (item.source_type as Item["sourceType"]) || undefined,
    quote: (item.conversation_text as string) || "",
    aiNote: "",
    confidence: item.clarification_type ? 0.6 : 0.8,
    memoryStrength: 0.5,
    createdBy: "ai",
    createdAt: item.created_at as string,
    clarificationType: (item.clarification_type as Item["clarificationType"]) || undefined,
    clarificationQuestion: (item.clarification_question as string) || undefined,
  };
}

// Map Supabase project to app Project
function projectToProject(project: Record<string, unknown>): Project {
  return {
    id: project.id as string,
    name: project.name as string,
    description: (project.description as string) || "",
    sources: [],
  };
}

// Map Supabase person to app Person
function personToPerson(person: Record<string, unknown>): Person {
  return {
    id: person.id as string,
    name: person.name as string,
    org: (person.company as string) || "",
    role: (person.role as string) || undefined,
    phone: (person.phone as string) || undefined,
    lastConversation: (person.last_conversation_at as string)?.slice(0, 10) || todayISO(),
    activity: [],
  };
}

interface Ctx extends State {
  hydrated: boolean;
  update: (id: string, patch: Partial<Item>) => void;
  editItem: (id: string, patch: Partial<Item>) => Promise<boolean>;
  addItems: (items: Item[], conversationText?: string) => Promise<Array<{ index: number; id: string }>>;
  complete: (id: string) => Promise<boolean>;
  snooze: (id: string, days: number) => Promise<boolean>;
  followUp: (id: string, days: number) => Promise<boolean>;
  markWaitingFollowedUp: (id: string, nextDays?: number) => Promise<boolean>;
  track: (
    id: string,
    details?: { personName?: string; due?: string; time?: string; title?: string },
  ) => Promise<string | false>;
  ignore: (id: string) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
  setSettings: (patch: Partial<Settings>) => Promise<boolean>;
  reset: () => void;
  personOf: (id?: string) => Person | undefined;
  projectOf: (id?: string) => Project | undefined;
  // New methods
  toggleReminder: (id: string) => Promise<boolean>;
  setReminderIntensity: (id: string, intensity: ReminderIntensity) => Promise<boolean>;
  setReminderChannels: (id: string, channels: ReminderChannel[]) => Promise<boolean>;
}

const StoreContext = createContext<Ctx | null>(null);

export function NantiProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(emptyState);
  const [hydrated, setHydrated] = useState(false);
  const [useSupabase, setUseSupabase] = useState(false);
  const { user, loading: authLoading, signOut } = useSupabaseAuth();
  const [loadError, setLoadError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Load data from Supabase when authenticated
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    setHydrated(false);
    setLoadError(false);
    setState(emptyState);

    if (user) {
      setUseSupabase(true);
      const loadFromSupabase = async () => {
        try {
          const [projectsData, peopleData, activityData, tasksData, waitingData, inboxData] = await Promise.all([
            fetchProjects(),
            fetchPeople(),
            fetchPersonActivity(),
            fetchTasks(),
            fetchWaitingItems(),
            fetchInboxItems(),
          ]);

          const remoteSettings = await fetchUserSettings();
          const savedSettings = { ...defaultSettings, ...remoteSettings };
          if (cancelled) return;

          const activityByPerson = new Map<string, Person["activity"]>();
          for (const row of activityData) {
            const personId = row.person_id as string;
            const current = activityByPerson.get(personId) || [];
            current.push({
              date: String(row.occurred_at || new Date().toISOString()).slice(0, 10),
              text: String(row.summary || ""),
            });
            activityByPerson.set(personId, current.slice(0, 20));
          }

          setState({
            projects: projectsData.map(projectToProject),
            people: peopleData.map((row) => {
              const person = personToPerson(row);
              return { ...person, activity: activityByPerson.get(person.id) || [] };
            }),
            items: [...tasksData.map(taskToItem), ...waitingData.map(waitingToItem), ...inboxData.map(inboxToItem)],
            settings: savedSettings,
          });
        } catch (err) {
          console.error("Failed to load from Supabase:", err);
          if (!cancelled) setLoadError(true);
        } finally {
          if (!cancelled) setHydrated(true);
        }
      };
      loadFromSupabase();
    } else {
      setUseSupabase(false);
      loadFromLocalStorage();
    }
    return () => { cancelled = true; };
  }, [user?.id, authLoading, retryCount]);

  const loadFromLocalStorage = () => {
    let next = freshState();
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as State;
        next = rebase({
          ...next,
          ...parsed,
          settings: { ...defaultSettings, ...parsed.settings },
        });
      }
    } catch {
      /* ignore */
    }
    setState(next);
    setHydrated(true);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const persist = useCallback(
    (next: State) => {
      setState(next);
      if (!useSupabase) {
        try {
          window.localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }
    },
    [useSupabase],
  );

  const mutate = useCallback(
    (fn: (s: State) => State) =>
      setState((s) => {
        const next = fn(s);
        if (!useSupabase) {
          try {
            window.localStorage.setItem(KEY, JSON.stringify(next));
          } catch {
            /* ignore */
          }
        }
        return next;
      }),
    [useSupabase],
  );

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      hydrated,
      update: (id, patch) => {
        if (useSupabase) {
          // Find if it's a task or waiting item
          const item = state.items.find((i) => i.id === id);
          if (item?.kind === "waiting") {
            updateWaitingItemFn({ data: { id, ...patch } }).catch(console.error);
          } else {
            const dbPatch: Record<string, unknown> = {};
            if (patch.title) dbPatch.title = patch.title;
            if (patch.description) dbPatch.description = patch.description;
            if (patch.status) {
              dbPatch.status =
                patch.status === "done"
                  ? "completed"
                  : patch.status === "ignored"
                    ? "dismissed"
                    : "pending";
            }
            if (patch.priority) dbPatch.priority = patch.priority;
            if (patch.due) dbPatch.due_date = patch.due;
            if (patch.projectId !== undefined) dbPatch.project_id = patch.projectId || null;
            if (patch.personId !== undefined) dbPatch.person_id = patch.personId || null;
            updateTaskFn({ data: { id, ...dbPatch } }).catch(console.error);
          }
        }
        mutate((s) => ({
          ...s,
          items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        }));
      },
      editItem: async (id, patch) => {
        const item = state.items.find((i) => i.id === id);
        if (!item || item.status === "inbox") return false;

        const resolvedPatch: Partial<Item> = { ...patch };
        let resolvedPerson: Person | undefined;
        let resolvedProject: Project | undefined;

        if (useSupabase) {
          try {
            if (patch.personName?.trim() && patch.personId === undefined) {
              const person = await resolvePersonMemory({ data: { name: patch.personName.trim() } });
              resolvedPerson = personToPerson(person);
              resolvedPatch.personId = resolvedPerson.id;
              resolvedPatch.personName = resolvedPerson.name;
            }
            if (patch.projectName?.trim() && patch.projectId === undefined) {
              const project = await resolveProjectMemory({ data: { name: patch.projectName.trim() } });
              resolvedProject = projectToProject(project);
              resolvedPatch.projectId = resolvedProject.id;
              resolvedPatch.projectName = resolvedProject.name;
            }

            if (item.kind === "waiting") {
              await updateWaitingItemFn({
                data: {
                  id,
                  title: resolvedPatch.title,
                  person_id:
                    resolvedPatch.personId === undefined ? undefined : resolvedPatch.personId || null,
                  project_id:
                    resolvedPatch.projectId === undefined ? undefined : resolvedPatch.projectId || null,
                  follow_up_at: resolvedPatch.followUpAt,
                  auto_follow_up_enabled: resolvedPatch.autoFollowUpEnabled,
                  status:
                    resolvedPatch.status === "received"
                      ? "received"
                      : resolvedPatch.status === "open"
                        ? "waiting"
                        : undefined,
                },
              });
            } else {
              await updateTaskFn({
                data: {
                  id,
                  title: resolvedPatch.title,
                  description: resolvedPatch.description,
                  type:
                    resolvedPatch.kind && resolvedPatch.kind !== "invoice"
                      ? resolvedPatch.kind
                      : undefined,
                  status:
                    resolvedPatch.status === "done"
                      ? "completed"
                      : resolvedPatch.status === "ignored"
                        ? "dismissed"
                        : resolvedPatch.status === "open"
                          ? "pending"
                          : undefined,
                  priority:
                    resolvedPatch.priority === "critical" ? "urgent" : resolvedPatch.priority,
                  due_date: resolvedPatch.due,
                  time: resolvedPatch.time,
                  person_id:
                    resolvedPatch.personId === undefined ? undefined : resolvedPatch.personId || null,
                  project_id:
                    resolvedPatch.projectId === undefined ? undefined : resolvedPatch.projectId || null,
                  person_name: resolvedPatch.personName,
                  project_name: resolvedPatch.projectName,
                  reminder_enabled: resolvedPatch.reminderEnabled,
                  reminder_time:
                    resolvedPatch.reminderTime === undefined
                      ? undefined
                      : resolvedPatch.reminderTime || null,
                  reminder_channels: resolvedPatch.reminderChannels,
                  reminder_intensity:
                    resolvedPatch.reminderIntensity === undefined
                      ? undefined
                      : resolvedPatch.reminderIntensity || null,
                  semantic_context: resolvedPatch.semanticContext,
                },
              });
            }
          } catch (error) {
            console.error("Failed to edit item:", error);
            toast.error("Perubahan belum tersimpan. Coba lagi.");
            return false;
          }
        }

        mutate((current) => ({
          ...current,
          items: current.items.map((i) => (i.id === id ? { ...i, ...resolvedPatch } : i)),
          people:
            resolvedPerson && !current.people.some((person) => person.id === resolvedPerson!.id)
              ? [resolvedPerson, ...current.people]
              : current.people,
          projects:
            resolvedProject && !current.projects.some((project) => project.id === resolvedProject!.id)
              ? [resolvedProject, ...current.projects]
              : current.projects,
        }));
        void logProductEvent({
          data: {
            event_name: "item_edited",
            item_id: id,
            source: "assistant",
            properties: { fields: Object.keys(resolvedPatch) },
          },
        }).catch(() => {});
        return true;
      },
      addItems: async (newItems, conversationText?: string) => {
        if (!useSupabase) {
          mutate((s) => ({ ...s, items: [...newItems, ...s.items] }));
          return newItems.map((item, index) => ({ index, id: item.id }));
        }
        const newPeople: Person[] = [];
        const newProjects: Project[] = [];
        const resolvedPeople = new Map<string, string>();
        const resolvedProjects = new Map<string, string>();

        for (const item of newItems) {
          if (!item.personId && item.personName) {
            const key = item.personName.trim().toLowerCase();
            if (key && !resolvedPeople.has(key)) {
              try {
                const person = await resolvePersonMemory({ data: { name: item.personName } });
                const mapped = personToPerson(person);
                resolvedPeople.set(key, mapped.id);
                newPeople.push(mapped);
              } catch (error) {
                console.error("Failed to resolve person memory:", error);
              }
            }
          }
          if (!item.projectId && item.projectName) {
            const key = item.projectName.trim().toLowerCase();
            if (key && !resolvedProjects.has(key)) {
              try {
                const project = await resolveProjectMemory({ data: { name: item.projectName } });
                const mapped = projectToProject(project);
                resolvedProjects.set(key, mapped.id);
                newProjects.push(mapped);
              } catch (error) {
                console.error("Failed to resolve project memory:", error);
              }
            }
          }
        }

        const resolvedItems = newItems.map((item) => ({
          ...item,
          personId:
            item.personId ||
            (item.personName ? resolvedPeople.get(item.personName.trim().toLowerCase()) : undefined),
          projectId:
            item.projectId ||
            (item.projectName ? resolvedProjects.get(item.projectName.trim().toLowerCase()) : undefined),
        }));

        let conversationId: string | undefined;
        if (conversationText) {
          const conversation = await createConversationFn({ data: {
            source: resolvedItems.some((item) => item.sourceType === "chat")
              ? "Chat dengan NANTI"
              : "Impor percakapan",
            message_text: conversationText.slice(0, 20000),
          } });
          conversationId = conversation.id;
        }
        const results = await Promise.allSettled(resolvedItems.map(async (item) => {
          if (item.status === "inbox") {
            const saved = await createInboxItemFn({ data: {
              type: item.kind, title: item.title, person_name: item.personName,
              project_name: item.projectName, due_date: item.due,
              conversation_text: conversationText?.slice(0, 5000),
              source: item.source, source_type: item.sourceType,
              clarification_type: item.clarificationType,
              clarification_question: item.clarificationQuestion,
              semantic_context: item.semanticContext,
              status: "pending",
            } });
            return inboxToItem(saved);
          }
          if (item.kind === "waiting") {
            const saved = await createWaitingItemFn({ data: {
              title: item.title, person_id: item.personId, project_id: item.projectId,
              person_name: item.personName, project_name: item.projectName,
              started_at: item.since || new Date().toISOString(),
              source: item.source, quote: item.quote, ai_note: item.aiNote,
              confidence: item.confidence, source_type: item.sourceType,
              conversation_id: conversationId,
              follow_up_at:
                item.followUpAt ||
                new Date(Date.now() + 2 * 86400000).toISOString(),
              auto_follow_up_enabled: item.autoFollowUpEnabled ?? true,
              semantic_context: item.semanticContext,
            } });
            return waitingToItem(saved);
          }
          const saved = await createTaskFn({ data: {
            title: item.title, description: item.description, type: item.kind,
            status: "pending", priority: item.priority, due_date: item.due,
            project_id: item.projectId, person_id: item.personId, source: item.source,
            quote: item.quote, ai_note: item.aiNote, confidence: item.confidence,
            source_type: item.sourceType, time: item.time, conversation_id: conversationId,
            person_name: item.personName, project_name: item.projectName,
            reminder_enabled: item.reminderEnabled,
            reminder_time: item.reminderTime,
            reminder_channels: item.reminderChannels,
            reminder_intensity: item.reminderIntensity,
            semantic_context: item.semanticContext,
          } });
          return taskToItem(saved);
        }));
        const savedItems: Item[] = [];
        const savedRecords: Array<{ index: number; id: string }> = [];
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            savedItems.push(result.value);
            savedRecords.push({ index, id: result.value.id });
          } else {
            console.error("Failed to save imported item:", result.reason);
          }
        });
        mutate((current) => {
          const mergedPeople = [
            ...newPeople.filter(
              (person) => !current.people.some((existing) => existing.id === person.id),
            ),
            ...current.people,
          ];
          const nowDay = todayISO();
          return {
            ...current,
            items: [...savedItems, ...current.items],
            people: mergedPeople.map((person) => {
              const related = savedItems.filter((item) => item.personId === person.id);
              if (!related.length) return person;
              return {
                ...person,
                lastConversation: nowDay,
                activity: [
                  ...related.map((item) => ({
                    date: nowDay,
                    text: `Captured: ${item.title}`,
                  })),
                  ...person.activity,
                ].slice(0, 20),
              };
            }),
            projects: [
              ...newProjects.filter(
                (project) => !current.projects.some((existing) => existing.id === project.id),
              ),
              ...current.projects,
            ],
          };
        });
        for (const savedItem of savedItems) {
          void logProductEvent({
            data: {
              event_name: "capture_saved",
              item_id: savedItem.id,
              source: savedItem.sourceType || "unknown",
              properties: {
                kind: savedItem.kind,
                needs_clarification: savedItem.status === "inbox",
              },
            },
          }).catch(() => {});
          if (savedItem.personId) {
            void logPersonActivity({
              data: {
                person_id: savedItem.personId,
                event_type: "captured",
                item_id: savedItem.id,
                conversation_id: conversationId,
                summary: `Captured: ${savedItem.title}`,
                source: savedItem.source || savedItem.sourceType || "NANTI",
                dedupe_key: `capture:${savedItem.id}`,
                metadata: { kind: savedItem.kind },
              },
            }).catch(() => {});
          }
        }
        return savedRecords;
      },
      complete: async (id) => {
        const current = state.items.find((i) => i.id === id);
        if (!current || current.status === "inbox") return false;
        if (useSupabase) {
          const item = state.items.find((i) => i.id === id);
          try {
            if (item?.kind === "waiting") {
              await updateWaitingItemFn({ data: { id, status: "received" } });
            } else {
              await updateTaskFn({ data: { id, status: "completed" } });
            }
          } catch (error) {
            console.error("Failed to complete item:", error);
            toast.error("Tugas belum ditandai selesai. Coba lagi.");
            return false;
          }
        }
        const completionDay = todayISO();
        mutate((s) => ({
          ...s,
          items: s.items.map((i) =>
            i.id === id ? { ...i, status: i.kind === "waiting" ? "received" : "done" } : i,
          ),
          people: current.personId
            ? s.people.map((person) =>
                person.id === current.personId
                  ? {
                      ...person,
                      ...(current.kind === "waiting" ? { lastConversation: completionDay } : {}),
                      activity: [
                        {
                          date: completionDay,
                          text:
                            current.kind === "waiting"
                              ? `Received: ${current.title}`
                              : `Completed: ${current.title}`,
                        },
                        ...person.activity,
                      ].slice(0, 20),
                    }
                  : person,
              )
            : s.people,
        }));
        void logProductEvent({
          data: {
            event_name: current.kind === "waiting" ? "waiting_received" : "task_completed",
            item_id: id,
            source: "app",
          },
        }).catch(() => {});
        if (current.personId) {
          void logPersonActivity({
            data: {
              person_id: current.personId,
              event_type: current.kind === "waiting" ? "received" : "completed",
              item_id: id,
              summary:
                current.kind === "waiting"
                  ? `Received: ${current.title}`
                  : `Completed: ${current.title}`,
              source: current.source || "NANTI",
              dedupe_key: `${current.kind === "waiting" ? "received" : "completed"}:${id}`,
            },
          }).catch(() => {});
        }
        return true;
      },
      snooze: async (id, days) => {
        const item = state.items.find((i) => i.id === id);
        if (!item) return false;
        if (item.kind === "waiting" || item.status === "inbox") {
          toast.error("Penundaan untuk item ini belum tersedia.");
          return false;
        }
        const base = item.due && item.due > todayISO() ? item.due : todayISO();
        const due = addDays(base, days);
        if (useSupabase) {
          try {
            await updateTaskFn({ data: { id, due_date: due } });
          } catch (error) {
            console.error("Failed to postpone task:", error);
            toast.error("Jadwal belum berubah. Coba lagi.");
            return false;
          }
        }
        mutate((s) => ({ ...s, items: s.items.map((i) => i.id === id ? { ...i, due } : i) }));
        return true;
      },
      followUp: async (id, days) => {
        const item = state.items.find((i) => i.id === id);
        if (!item) return false;
        if (item.kind === "waiting" || item.status === "inbox") {
          toast.error("Tindak lanjut untuk item ini belum tersedia.");
          return false;
        }
        const base = item.due && item.due > todayISO() ? item.due : todayISO();
        const due = addDays(base, days);
        if (useSupabase) {
          try {
            await updateTaskFn({
              data: { id, type: "followup", status: "pending", due_date: due },
            });
          } catch (error) {
            console.error("Failed to schedule follow-up:", error);
            toast.error("Tindak lanjut belum dijadwalkan. Coba lagi.");
            return false;
          }
        }
        mutate((s) => ({
          ...s,
          items: s.items.map((i) =>
            i.id === id ? { ...i, kind: "followup", status: "open", due } : i,
          ),
        }));
        return true;
      },
      markWaitingFollowedUp: async (id, nextDays = 2) => {
        const item = state.items.find((i) => i.id === id);
        if (!item || item.kind !== "waiting" || item.status !== "open") return false;
        if (useSupabase) {
          try {
            const updated = await markWaitingFollowedUpFn({ data: { id, next_days: nextDays } });
            const mapped = waitingToItem(updated as Record<string, unknown>);
            mutate((current) => ({
              ...current,
              items: current.items.map((i) => (i.id === id ? mapped : i)),
            }));
          } catch (error) {
            console.error("Failed to mark waiting follow-up:", error);
            toast.error("Follow-up belum tercatat. Coba lagi.");
            return false;
          }
        } else {
          const now = new Date().toISOString();
          const next = new Date(Date.now() + nextDays * 86400000).toISOString();
          mutate((current) => ({
            ...current,
            items: current.items.map((i) =>
              i.id === id
                ? {
                    ...i,
                    lastFollowedUpAt: now,
                    followUpAt: next,
                    followUpCount: (i.followUpCount || 0) + 1,
                  }
                : i,
            ),
          }));
        }
        void logProductEvent({
          data: {
            event_name: "waiting_followed_up",
            item_id: id,
            source: "app",
            properties: { next_days: nextDays },
          },
        }).catch(() => {});
        if (item.personId) {
          const followDay = todayISO();
          mutate((current) => ({
            ...current,
            people: current.people.map((person) =>
              person.id === item.personId
                ? {
                    ...person,
                    lastConversation: followDay,
                    activity: [
                      { date: followDay, text: `Followed up: ${item.title}` },
                      ...person.activity,
                    ].slice(0, 20),
                  }
                : person,
            ),
          }));
          void logPersonActivity({
            data: {
              person_id: item.personId,
              event_type: "followed_up",
              item_id: id,
              summary: `Followed up: ${item.title}`,
              source: item.source || "NANTI",
              dedupe_key: `followed_up:${id}:${item.followUpCount || 0}`,
              metadata: { next_days: nextDays },
            },
          }).catch(() => {});
        }
        return true;
      },
      track: async (id, details) => {
        const item = state.items.find((i) => i.id === id);
        if (!item || item.status !== "inbox") return false;
        if (useSupabase) {
          try {
            const result = await promoteInboxItemFn({
              data: {
                id,
                title: details?.title || item.title,
                person_name: details?.personName || item.personName,
                due_date: details?.due || item.due,
              },
            });
            let promoted =
              result.entity === "waiting" ? waitingToItem(result.item) : taskToItem(result.item);
            if (details?.time && result.entity === "task") {
              await updateTaskFn({ data: { id: promoted.id, time: details.time } });
              promoted = { ...promoted, time: details.time };
            }
            mutate((s) => ({
              ...s,
              items: [promoted, ...s.items.filter((i) => i.id !== id)],
            }));
            void logProductEvent({
              data: {
                event_name: "inbox_promoted",
                item_id: promoted.id,
                source: "clarification",
              },
            }).catch(() => {});
            if (promoted.personId) {
              const trackDay = todayISO();
              mutate((current) => ({
                ...current,
                people: current.people.map((person) =>
                  person.id === promoted.personId
                    ? {
                        ...person,
                        lastConversation: trackDay,
                        activity: [
                          { date: trackDay, text: `Clarified and saved: ${promoted.title}` },
                          ...person.activity,
                        ].slice(0, 20),
                      }
                    : person,
                ),
              }));
              void logPersonActivity({
                data: {
                  person_id: promoted.personId,
                  event_type: "captured",
                  item_id: promoted.id,
                  summary: `Clarified and saved: ${promoted.title}`,
                  source: "clarification",
                  dedupe_key: `promoted:${promoted.id}`,
                },
              }).catch(() => {});
            }
            return promoted.id;
          } catch (error) {
            console.error("Failed to promote inbox item:", error);
            toast.error("Item belum disimpan sebagai tugas. Coba lagi.");
            return false;
          }
        }
        mutate((s) => ({
          ...s,
          items: s.items.map((i) =>
            i.id === id
              ? {
                  ...i,
                  title: details?.title || i.title,
                  personName: details?.personName || i.personName,
                  due: details?.due || i.due,
                  time: details?.time || i.time,
                  status: "open" as const,
                  memoryStrength: Math.min((i.memoryStrength || 1) + 0.2, 2),
                }
              : i,
          ),
        }));
        return id;
      },
      ignore: async (id) => {
        const item = state.items.find((i) => i.id === id);
        if (!item || item.status !== "inbox") return false;
        if (useSupabase) {
          try {
            await updateInboxItemFn({ data: { id, status: "ignored" } });
          } catch (error) {
            console.error("Failed to ignore inbox item:", error);
            toast.error("Item belum diabaikan. Coba lagi.");
            return false;
          }
        }
        mutate((s) => ({
          ...s,
          items: s.items.filter((i) => i.id !== id),
        }));
        return true;
      },
      remove: async (id) => {
        const item = state.items.find((i) => i.id === id);
        if (!item) return false;
        if (useSupabase) {
          if (item.status === "inbox") {
            toast.error("Gunakan Abaikan untuk item di kotak masuk.");
            return false;
          }
          try {
            if (item.kind === "waiting") {
              await deleteWaitingItemFn({ data: { id } });
            } else {
              await deleteTaskFn({ data: { id } });
            }
          } catch (error) {
            console.error("Failed to delete item:", error);
            toast.error("Item belum dihapus. Coba lagi.");
            return false;
          }
        }
        mutate((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }));
        return true;
      },
      setSettings: async (patch) => {
        const newSettings = { ...state.settings, ...patch };
        if (useSupabase) {
          try {
            await upsertUserSettings({ data: { settings: newSettings } });
          } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error("Preferensi belum tersimpan. Periksa koneksi dan coba lagi.");
            return false;
          }
        }
        mutate((s) => ({ ...s, settings: newSettings }));
        return true;
      },
      reset: () => {
        if (useSupabase) {
          seedDemoData().then(() => {
            Promise.all([
              fetchProjects(),
              fetchPeople(),
              fetchTasks(),
              fetchWaitingItems(),
              fetchInboxItems(),
            ])
              .then(([p, pe, t, w, i]) => {
                setState({
                  projects: p.map(projectToProject),
                  people: pe.map(personToPerson),
                  items: [...t.map(taskToItem), ...w.map(waitingToItem), ...i.map(inboxToItem)],
                  settings: defaultSettings,
                });
              })
              .catch(console.error);
          });
        } else {
          persist(freshState());
        }
      },
      personOf: (id) => state.people.find((p) => p.id === id),
      projectOf: (id) => state.projects.find((p) => p.id === id),
      toggleReminder: async (id) => {
        const item = state.items.find((i) => i.id === id);
        if (!item || item.kind === "waiting" || item.status === "inbox") return false;
        const reminderEnabled = !item.reminderEnabled;
        if (useSupabase) {
          try {
            await updateTaskFn({ data: { id, reminder_enabled: reminderEnabled } });
          } catch (error) {
            console.error("Failed to toggle reminder:", error);
            toast.error("Pengingat belum tersimpan. Coba lagi.");
            return false;
          }
        }
        mutate((s) => ({
          ...s,
          items: s.items.map((i) => i.id === id ? { ...i, reminderEnabled } : i),
        }));
        return true;
      },
      setReminderIntensity: async (id, intensity) => {
        const item = state.items.find((i) => i.id === id);
        if (!item || item.kind === "waiting" || item.status === "inbox") return false;
        if (useSupabase) {
          try {
            await updateTaskFn({ data: { id, reminder_intensity: intensity } });
          } catch (error) {
            console.error("Failed to set reminder intensity:", error);
            toast.error("Intensitas pengingat belum tersimpan.");
            return false;
          }
        }
        mutate((s) => ({
          ...s,
          items: s.items.map((i) => i.id === id ? { ...i, reminderIntensity: intensity } : i),
        }));
        return true;
      },
      setReminderChannels: async (id, channels) => {
        const item = state.items.find((i) => i.id === id);
        if (!item || item.kind === "waiting" || item.status === "inbox") return false;
        if (useSupabase) {
          try {
            await updateTaskFn({ data: { id, reminder_channels: channels } });
          } catch (error) {
            console.error("Failed to set reminder channels:", error);
            toast.error("Channel pengingat belum tersimpan.");
            return false;
          }
        }
        mutate((s) => ({
          ...s,
          items: s.items.map((i) => i.id === id ? { ...i, reminderChannels: channels } : i),
        }));
        return true;
      },
    }),
    [state, hydrated, mutate, persist, useSupabase],
  );

  if (user && loadError) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md space-y-4">
          <h1 className="text-xl font-semibold">Data NANTI belum bisa dimuat</h1>
          <p>Periksa koneksi Anda lalu coba lagi. Data akun Anda belum dimuat dari server.</p>
          <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground" onClick={() => setRetryCount((count) => count + 1)}>Coba lagi</button>
          <button className="ml-4 underline" onClick={() => { void signOut(); }}>Keluar</button>
        </div>
      </main>
    );
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useNanti() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useNanti must be used inside NantiProvider");
  return ctx;
}
