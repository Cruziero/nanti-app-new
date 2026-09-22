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
    source: "",
    quote: "",
    aiNote: "",
    confidence: 0.8,
    memoryStrength: 1.0,
    createdBy: "ai",
    createdAt: item.created_at as string,
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
    source: "",
    quote: (item.conversation_text as string) || "",
    aiNote: "",
    confidence: 0.8,
    memoryStrength: 0.5,
    createdBy: "ai",
    createdAt: item.created_at as string,
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
    lastConversation: (person.last_conversation_at as string)?.slice(0, 10) || todayISO(),
    activity: [],
  };
}

interface Ctx extends State {
  hydrated: boolean;
  update: (id: string, patch: Partial<Item>) => void;
  addItems: (items: Item[], conversationText?: string) => Promise<number[]>;
  complete: (id: string) => Promise<void>;
  snooze: (id: string, days: number) => void;
  track: (id: string) => void;
  ignore: (id: string) => void;
  remove: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => Promise<boolean>;
  reset: () => void;
  personOf: (id?: string) => Person | undefined;
  projectOf: (id?: string) => Project | undefined;
  // New methods
  toggleReminder: (id: string) => void;
  setReminderIntensity: (id: string, intensity: ReminderIntensity) => void;
  setReminderChannels: (id: string, channels: ReminderChannel[]) => void;
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
          const [projectsData, peopleData, tasksData, waitingData, inboxData] = await Promise.all([
            fetchProjects(),
            fetchPeople(),
            fetchTasks(),
            fetchWaitingItems(),
            fetchInboxItems(),
          ]);

          const remoteSettings = await fetchUserSettings();
          const savedSettings = { ...defaultSettings, ...remoteSettings };
          if (cancelled) return;

          setState({
            projects: projectsData.map(projectToProject),
            people: peopleData.map(personToPerson),
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
      addItems: async (newItems, conversationText?: string) => {
        if (!useSupabase) {
          mutate((s) => ({ ...s, items: [...newItems, ...s.items] }));
          return newItems.map((_, index) => index);
        }
        let conversationId: string | undefined;
        if (conversationText) {
          const conversation = await createConversationFn({ data: {
            source: "Impor percakapan", message_text: conversationText.slice(0, 20000),
          } });
          conversationId = conversation.id;
        }
        const results = await Promise.allSettled(newItems.map(async (item) => {
          if (item.status === "inbox") {
            const saved = await createInboxItemFn({ data: {
              type: item.kind, title: item.title, person_name: item.personName,
              project_name: item.projectName, due_date: item.due,
              conversation_text: conversationText?.slice(0, 5000), status: "pending",
            } });
            return inboxToItem(saved);
          }
          if (item.kind === "waiting") {
            const saved = await createWaitingItemFn({ data: {
              title: item.title, person_id: item.personId, project_id: item.projectId,
              started_at: item.since || new Date().toISOString(),
            } });
            return waitingToItem(saved);
          }
          const saved = await createTaskFn({ data: {
            title: item.title, description: item.description, type: item.kind,
            status: "pending", priority: item.priority, due_date: item.due,
            project_id: item.projectId, person_id: item.personId, source: item.source,
            quote: item.quote, ai_note: item.aiNote, confidence: item.confidence,
            source_type: item.sourceType, time: item.time, conversation_id: conversationId,
          } });
          return taskToItem(saved);
        }));
        const savedItems: Item[] = [];
        const savedIndexes: number[] = [];
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            savedItems.push(result.value);
            savedIndexes.push(index);
          } else {
            console.error("Failed to save imported item:", result.reason);
          }
        });
        mutate((s) => ({ ...s, items: [...savedItems, ...s.items] }));
        return savedIndexes;
      },
      complete: async (id) => {
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
            return;
          }
        }
        mutate((s) => ({
          ...s,
          items: s.items.map((i) =>
            i.id === id ? { ...i, status: i.kind === "waiting" ? "received" : "done" } : i,
          ),
        }));
      },
      snooze: (id, days) => {
        if (useSupabase) {
          const item = state.items.find((i) => i.id === id);
          if (item?.kind === "waiting") {
            updateWaitingItemFn({ data: { id, started_at: new Date().toISOString() } }).catch(
              console.error,
            );
          } else {
            const newDue = addDays(item?.due ?? todayISO(), days);
            updateTaskFn({ data: { id, due_date: newDue } }).catch(console.error);
          }
        }
        mutate((s) => ({
          ...s,
          items: s.items.map((i) => {
            if (i.id !== id) return i;
            return i.kind === "waiting"
              ? { ...i, since: dayOffset(0) }
              : { ...i, due: addDays(i.due ?? todayISO(), days) };
          }),
        }));
      },
      track: (id) => {
        if (useSupabase) {
          updateInboxItemFn({ data: { id, status: "tracked" } }).catch(console.error);
        }
        mutate((s) => ({
          ...s,
          items: s.items.map((i) =>
            i.id === id
              ? { ...i, status: "open" as const, memoryStrength: Math.min((i.memoryStrength || 1) + 0.2, 2) }
              : i,
          ),
        }));
      },
      ignore: (id) => {
        if (useSupabase) {
          updateInboxItemFn({ data: { id, status: "ignored" } }).catch(console.error);
        }
        mutate((s) => ({
          ...s,
          items: s.items.map((i) =>
            i.id === id
              ? { ...i, status: "ignored" as const, memoryStrength: Math.max((i.memoryStrength || 1) - 0.3, 0) }
              : i,
          ),
        }));
      },
      remove: (id) => {
        if (useSupabase) {
          const item = state.items.find((i) => i.id === id);
          if (item?.kind === "waiting") {
            deleteWaitingItemFn({ data: { id } }).catch(console.error);
          } else {
            deleteTaskFn({ data: { id } }).catch(console.error);
          }
        }
        mutate((s) => ({ ...s, items: s.items.filter((i) => i.id !== id) }));
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
      toggleReminder: (id) => {
        mutate((s) => ({
          ...s,
          items: s.items.map((i) =>
            i.id === id ? { ...i, reminderEnabled: !i.reminderEnabled } : i,
          ),
        }));
      },
      setReminderIntensity: (id, intensity) => {
        mutate((s) => ({
          ...s,
          items: s.items.map((i) => (i.id === id ? { ...i, reminderIntensity: intensity } : i)),
        }));
      },
      setReminderChannels: (id, channels) => {
        mutate((s) => ({
          ...s,
          items: s.items.map((i) => (i.id === id ? { ...i, reminderChannels: channels } : i)),
        }));
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
