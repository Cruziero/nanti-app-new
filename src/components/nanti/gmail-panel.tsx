import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import {
  createEmailWorkspace,
  fetchEmailWorkspaces,
  fetchGmailWorkspace,
  startGmailConnect,
  disconnectGmail,
  listGmailEmails,
  readGmailEmail,
  suggestGmailTasks,
  createGmailTask,
  updateGmailTask,
} from "@/lib/nanti-gmail.functions";
import type { EmailPreview } from "@/lib/nanti-gmail.server";

type Workspace = { id: string; kind: string; name: string };
type Connection = { id: string; email: string; status: string };
type Draft = {
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  dueAt: string;
};
const control =
  "min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : "Could not complete this action. Please try again.";

export function GmailPanel() {
  const { user } = useSupabaseAuth();
  const cache = useQueryClient();
  const routeSearch = useRouterState({
    select: (state) => state.location.search as Record<string, unknown>,
  });
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const workspaces = useQuery({
    queryKey: ["email-workspaces", user?.id],
    queryFn: () => fetchEmailWorkspaces(),
    enabled: Boolean(user),
    retry: false,
  });
  const requested =
    typeof routeSearch["email_workspace"] === "string" ? routeSearch["email_workspace"] : "";
  const active =
    workspaces.data?.find((w) => w.id === (selected || requested)) ||
    workspaces.data?.find((w) => w.kind === "personal") ||
    workspaces.data?.[0];
  const callback = typeof routeSearch["gmail"] === "string" ? routeSearch["gmail"] : null;
  async function create(kind: "personal" | "business") {
    setCreating(true);
    try {
      const workspace = await createEmailWorkspace({
        data: { kind, name: kind === "personal" ? "Personal" : name },
      });
      await cache.invalidateQueries({ queryKey: ["email-workspaces", user?.id] });
      setSelected(workspace.id);
      setName("");
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setCreating(false);
    }
  }
  return (
    <section id="gmail" className="mb-10 scroll-mt-20 space-y-5">
      <div>
        <h2 className="font-serif text-2xl">Gmail</h2>
        <p className="mt-2 text-sm">Read an email. Keep the next step in NANTI.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose where each inbox belongs. Email tasks stay in this area, separate from your other
          NANTI tasks.
        </p>
      </div>
      {callback && (
        <p role="status" className="rounded-md bg-secondary p-3 text-sm">
          {callback === "connected"
            ? "Gmail connected. Choose your inbox below."
            : callback === "cancelled"
              ? "Gmail connection cancelled. You can connect again when ready."
              : "Gmail connection did not finish. Please reconnect; contact support if it keeps failing."}
        </p>
      )}
      {workspaces.isPending && <p role="status">Loading email workspaces…</p>}
      {workspaces.isError && (
        <div role="alert">
          <p>{errorText(workspaces.error)}</p>
          <Button
            variant="outline"
            className="mt-2 min-h-11"
            onClick={() => void workspaces.refetch()}
          >
            Retry loading workspaces
          </Button>
        </div>
      )}
      {workspaces.data && (
        <>
          {workspaces.data.length > 0 && (
            <div>
              <Label htmlFor="email-workspace">Email workspace</Label>
              <select
                id="email-workspace"
                className={`${control} mt-2`}
                value={active?.id || ""}
                onChange={(e) => setSelected(e.target.value)}
              >
                {workspaces.data.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.kind === "business" ? `Business: ${w.name}` : "Personal"}
                  </option>
                ))}
              </select>
            </div>
          )}
          {!workspaces.data.some((w) => w.kind === "personal") && (
            <Button
              disabled={creating}
              className="min-h-11"
              onClick={() => void create("personal")}
            >
              Add personal email workspace
            </Button>
          )}
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              void create("business");
            }}
          >
            <div className="min-w-0 flex-1">
              <Label htmlFor="email-business-name">Business name</Label>
              <Input
                id="email-business-name"
                className="mt-2 min-h-11"
                placeholder="Name of your business"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              variant="outline"
              className="min-h-11"
              disabled={creating || !name.trim()}
            >
              {creating ? "Adding workspace…" : "Add business workspace"}
            </Button>
          </form>
          {active && user && (
            <WorkspaceInbox key={`${user.id}:${active.id}`} workspace={active} userId={user.id} />
          )}
        </>
      )}
    </section>
  );
}

function WorkspaceInbox({ workspace, userId }: { workspace: Workspace; userId: string }) {
  const cache = useQueryClient();
  const queryKey = ["gmail-workspace", userId, workspace.id];
  const query = useQuery({
    queryKey,
    queryFn: () => fetchGmailWorkspace({ data: { workspaceId: workspace.id } }),
    retry: false,
  });
  const [connectionId, setConnectionId] = useState("");
  const [busy, setBusy] = useState(false);
  const connection =
    query.data?.connections.find((c) => c.id === connectionId) || query.data?.connections[0];
  const refresh = () => cache.invalidateQueries({ queryKey });
  async function connect() {
    setBusy(true);
    try {
      const result = await startGmailConnect({ data: { workspaceId: workspace.id } });
      window.location.assign(result.url);
    } catch (error) {
      toast.error(errorText(error));
      setBusy(false);
    }
  }
  async function disconnect() {
    if (!connection) return;
    setBusy(true);
    try {
      await disconnectGmail({ data: { workspaceId: workspace.id, connectionId: connection.id } });
      cache.removeQueries({ queryKey: ["gmail-emails", userId, workspace.id, connection.id] });
      await refresh();
      toast.success(`Gmail disconnected from ${workspace.name}. Saved tasks remain.`);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  async function toggleTask(taskId: string, status: "open" | "done") {
    setBusy(true);
    try {
      await updateGmailTask({ data: { workspaceId: workspace.id, taskId, status } });
      await refresh();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  if (query.isPending) return <p role="status">Loading Gmail for {workspace.name}…</p>;
  if (query.isError)
    return (
      <div role="alert">
        <p>{errorText(query.error)}</p>
        <Button className="mt-2 min-h-11" variant="outline" onClick={() => void query.refetch()}>
          Retry loading Gmail
        </Button>
      </div>
    );
  return (
    <div className="space-y-6 border-t border-border pt-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-medium">
          {workspace.kind === "personal" ? "Your personal inboxes" : `${workspace.name} inboxes`}
        </p>
        <Button className="min-h-11" disabled={busy} onClick={() => void connect()}>
          {busy ? "Please wait…" : "Connect Gmail"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        NANTI requests read access to Gmail. Saved tasks stay here after disconnecting.
      </p>
      {!connection && (
        <p>No Gmail connected here yet. Connect an account to read emails and create tasks.</p>
      )}
      {connection && (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Label htmlFor="gmail-account">Connected account</Label>
              <select
                id="gmail-account"
                className={`${control} mt-2`}
                value={connection.id}
                onChange={(e) => setConnectionId(e.target.value)}
              >
                {query.data!.connections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.email}
                    {c.status === "connected" ? "" : " (Reconnect required)"}
                  </option>
                ))}
              </select>
            </div>
            <Button
              variant="outline"
              className="min-h-11"
              disabled={busy}
              onClick={() => void disconnect()}
            >
              Disconnect this inbox
            </Button>
          </div>
          {connection.status !== "connected" ? (
            <p role="alert">
              Gmail access expired. Use Connect Gmail and choose this account again.
            </p>
          ) : (
            <EmailReader
              key={connection.id}
              workspace={workspace}
              userId={userId}
              connection={connection}
              aiAvailable={query.data!.aiAvailable}
              onSaved={refresh}
            />
          )}
        </>
      )}
      <div>
        <h3 className="font-medium">Email tasks in {workspace.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Review dates here. Automatic reminder delivery for email tasks is not available yet.
        </p>
        {query.data!.tasks.length === 0 && (
          <p className="mt-3 text-sm">No email tasks yet. Open an email and save its next step.</p>
        )}
        <ul className="mt-3 divide-y divide-border">
          {query.data!.tasks.map((task) => (
            <li key={task.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start">
              <div className="min-w-0 flex-1 break-words">
                <p className={task.status === "done" ? "line-through" : "font-medium"}>
                  {task.title}
                </p>
                <p className="mt-1 text-sm">
                  {task.due_at
                    ? `${new Date(task.due_at) < new Date() && task.status !== "done" ? "Overdue · " : "Due · "}${new Date(task.due_at).toLocaleString()}`
                    : "No deadline"}{" "}
                  · {task.priority} priority
                </p>
                {task.description && <p className="mt-1 text-sm">{task.description}</p>}
                <a
                  className="mt-1 inline-flex min-h-11 items-center text-sm text-primary underline"
                  href={task.email_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Source email: {task.email_subject}
                </a>
              </div>
              <Button
                className="min-h-11"
                variant="outline"
                disabled={busy}
                onClick={() => void toggleTask(task.id, task.status === "done" ? "open" : "done")}
              >
                {task.status === "done" ? "Reopen task" : "Mark done"}
              </Button>
            </li>
          ))}
        </ul>
        {query.data!.tasks.length === 200 && (
          <p className="text-sm">Showing the latest 200 email tasks.</p>
        )}
      </div>
    </div>
  );
}

function EmailReader({
  workspace,
  userId,
  connection,
  aiAvailable,
  onSaved,
}: {
  workspace: Workspace;
  userId: string;
  connection: Connection;
  aiAvailable: boolean;
  onSaved: () => Promise<unknown>;
}) {
  const [input, setInput] = useState("in:inbox newer_than:30d");
  const [search, setSearch] = useState(input);
  const [page, setPage] = useState<string | undefined>();
  const [email, setEmail] = useState<EmailPreview | null>(null);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const data = { workspaceId: workspace.id, connectionId: connection.id };
  const emails = useQuery({
    queryKey: ["gmail-emails", userId, workspace.id, connection.id, search, page],
    queryFn: () => listGmailEmails({ data: { ...data, query: search, pageToken: page } }),
    retry: false,
  });
  async function read(messageId: string) {
    setBusy(true);
    setError("");
    setEmail(null);
    setDrafts([]);
    setConsent(false);
    try {
      setEmail(await readGmailEmail({ data: { ...data, messageId } }));
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  async function suggest() {
    if (!email) return;
    setBusy(true);
    setError("");
    try {
      const result = await suggestGmailTasks({
        data: { ...data, messageId: email.id, consentToAi: true },
      });
      setDrafts(
        result.suggestions.map((s) => ({
          title: s.title,
          description: [
            s.description,
            s.due ? `Suggested deadline: ${s.due}. Confirm the date and time below.` : "",
            s.needsClarification ? s.question : "",
          ]
            .filter(Boolean)
            .join("\n")
            .slice(0, 2000),
          priority: s.priority,
          dueAt: "",
        })),
      );
      if (!result.suggestions.length)
        toast.info("NANTI found no clear next step. You can create a task manually.");
      else toast.info("Review each task and set a deadline if needed.");
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  async function save(index: number) {
    if (!email) return;
    const draft = drafts[index];
    if (!draft) return;
    setBusy(true);
    setError("");
    try {
      const result = await createGmailTask({
        data: {
          ...data,
          messageId: email.id,
          title: draft.title,
          description: draft.description,
          priority: draft.priority,
          dueAt: draft.dueAt ? new Date(draft.dueAt).toISOString() : null,
        },
      });
      await onSaved();
      setDrafts((d) => d.filter((_, i) => i !== index));
      toast.success(
        result.duplicate ? "This email task is already saved." : `Task saved in ${workspace.name}.`,
      );
    } catch (error) {
      setError(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  const change = (index: number, updates: Partial<Draft>) =>
    setDrafts((d) => d.map((draft, i) => (i === index ? { ...draft, ...updates } : draft)));
  return (
    <div className="space-y-4">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (input === search && !page) void emails.refetch();
          setSearch(input);
          setPage(undefined);
          setEmail(null);
          setDrafts([]);
        }}
      >
        <div className="min-w-0 flex-1">
          <Label htmlFor="gmail-search">Search Gmail</Label>
          <Input
            id="gmail-search"
            className="mt-2 min-h-11"
            value={input}
            maxLength={500}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Gmail search, e.g. in:inbox"
          />
        </div>
        <Button
          className="min-h-11"
          variant="outline"
          disabled={busy || emails.isFetching}
          type="submit"
        >
          Search emails
        </Button>
      </form>
      {emails.isFetching && <p role="status">Loading emails from {connection.email}…</p>}
      {emails.isError && (
        <div role="alert">
          <p>{errorText(emails.error)}</p>
          <Button className="mt-2 min-h-11" variant="outline" onClick={() => void emails.refetch()}>
            Retry loading emails
          </Button>
        </div>
      )}
      {emails.data && !emails.isFetching && (
        <>
          {emails.data.messages.length === 0 && (
            <p>No emails match this search. Try a different search or clear the date filter.</p>
          )}
          <ul className="divide-y divide-border">
            {emails.data.messages.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={busy}
                  className="w-full break-words py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
                  onClick={() => void read(m.id)}
                >
                  <span className="block font-medium">{m.subject}</span>
                  <span className="mt-1 block text-sm">{m.from}</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {page && (
              <Button
                className="min-h-11"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setPage(undefined);
                  setEmail(null);
                  setDrafts([]);
                }}
              >
                First page
              </Button>
            )}
            {emails.data.nextPageToken && (
              <Button
                className="min-h-11"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setPage(emails.data!.nextPageToken);
                  setEmail(null);
                  setDrafts([]);
                }}
              >
                Next emails
              </Button>
            )}
          </div>
        </>
      )}
      {busy && <p role="status">Working on this email…</p>}
      {error && (
        <p role="alert" className="rounded-md border border-destructive p-3">
          {error}
        </p>
      )}
      {email && (
        <article className="min-w-0 space-y-4 rounded-lg border border-border p-4 sm:p-5">
          <div className="break-words">
            <h3 className="font-medium">{email.subject}</h3>
            <p className="mt-1 text-sm">{email.from}</p>
          </div>
          <div className="max-h-80 overflow-y-auto whitespace-pre-wrap break-words text-sm">
            {email.text || "No readable message body. Open Gmail to view this email."}
          </div>
          <a
            href={email.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-sm text-primary underline"
          >
            Open this email in Gmail
          </a>
          <div className="flex flex-col gap-3">
            <Button
              className="min-h-11 self-start"
              variant="outline"
              disabled={busy}
              onClick={() =>
                setDrafts((d) => [
                  ...d,
                  { title: email.subject, description: "", priority: "medium", dueAt: "" },
                ])
              }
            >
              Create task manually
            </Button>
            {aiAvailable ? (
              <>
                <label className="flex min-h-11 items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="size-5 shrink-0"
                  />
                  Send this email's text to NANTI's AI provider (Google Gemini) to suggest tasks.
                </label>
                <Button
                  className="min-h-11 self-start"
                  disabled={busy || !consent}
                  onClick={() => void suggest()}
                >
                  Suggest tasks from this email
                </Button>
              </>
            ) : (
              <p className="text-sm">
                AI email analysis is not enabled on this deployment. You can create a task manually.
              </p>
            )}
          </div>
          {drafts.length > 0 && (
            <p className="text-sm">
              Save to {workspace.name}. Set deadlines in your device's local time.
            </p>
          )}
          {drafts.map((draft, index) => (
            <form
              key={index}
              className="space-y-3 border-t border-border pt-4"
              onSubmit={(e) => {
                e.preventDefault();
                void save(index);
              }}
            >
              <div>
                <Label htmlFor={`email-task-title-${index}`}>Task</Label>
                <Input
                  id={`email-task-title-${index}`}
                  className="mt-2 min-h-11"
                  required
                  maxLength={500}
                  value={draft.title}
                  onChange={(e) => change(index, { title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor={`email-task-note-${index}`}>Notes</Label>
                <textarea
                  id={`email-task-note-${index}`}
                  className={`${control} mt-2 min-h-20 py-2`}
                  maxLength={2000}
                  value={draft.description}
                  onChange={(e) => change(index, { description: e.target.value })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`email-task-due-${index}`}>Deadline (optional)</Label>
                  <Input
                    id={`email-task-due-${index}`}
                    className="mt-2 min-h-11"
                    type="datetime-local"
                    value={draft.dueAt}
                    onChange={(e) => change(index, { dueAt: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor={`email-task-priority-${index}`}>Priority</Label>
                  <select
                    id={`email-task-priority-${index}`}
                    className={`${control} mt-2`}
                    value={draft.priority}
                    onChange={(e) =>
                      change(index, { priority: e.target.value as Draft["priority"] })
                    }
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="min-h-11" type="submit" disabled={busy || !draft.title.trim()}>
                  Save task
                </Button>
                <Button
                  className="min-h-11"
                  variant="outline"
                  disabled={busy}
                  type="button"
                  onClick={() => setDrafts((d) => d.filter((_, i) => i !== index))}
                >
                  Discard suggestion
                </Button>
              </div>
            </form>
          ))}
        </article>
      )}
    </div>
  );
}
