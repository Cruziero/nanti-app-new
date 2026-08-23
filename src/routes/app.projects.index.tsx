import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader, EmptyState } from "@/components/nanti/app-shell";
import { useNanti } from "@/lib/nanti-store";
import { isOverdue, openItems } from "@/lib/nanti-utils";

export const Route = createFileRoute("/app/projects/")({
  head: () => ({
    meta: [
      { title: "Projects - NANTI" },
      { name: "description", content: "Work grouped automatically from conversations." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { projects, items } = useNanti();

  if (projects.length === 0) {
    return (
      <div>
        <PageHeader title="Projects" subtitle="Grouped automatically from conversations" />
        <EmptyState
          title="No projects yet"
          hint="Import a conversation and NANTI will group work into projects."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Projects" subtitle="Grouped automatically from conversations" />
      <div className="divide-y divide-border">
        {projects.map((p) => {
          const mine = items.filter((i) => i.projectId === p.id);
          const open = openItems(mine).filter((i) => i.kind !== "waiting").length;
          const waiting = openItems(mine).filter((i) => i.kind === "waiting").length;
          const overdue = mine.filter(isOverdue).length;
          return (
            <Link
              key={p.id}
              to="/app/projects/$projectId"
              params={{ projectId: p.id }}
              className="flex items-center gap-3 py-3 transition-colors hover:bg-secondary/30"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium">{p.name}</p>
                <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{p.description}</p>
              </div>
              <div className="flex shrink-0 gap-3 text-[11.5px] text-muted-foreground">
                <span>{open} open</span>
                {waiting > 0 && <span>{waiting} waiting</span>}
                {overdue > 0 && <span className="text-destructive">{overdue} overdue</span>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
