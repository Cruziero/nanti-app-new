import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/nanti/app-shell";
import { useNanti } from "@/lib/nanti-store";
import { isOverdue, openItems } from "@/lib/nanti-utils";

export const Route = createFileRoute("/app/projects/")({
  head: () => ({
    meta: [
      { title: "Projects · NANTI" },
      {
        name: "description",
        content: "NANTI groups work from your conversations into clear projects.",
      },
      { property: "og:title", content: "Projects · NANTI" },
      { property: "og:description", content: "All commitments grouped by project automatically." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { projects, items } = useNanti();

  return (
    <div>
      <PageHeader title="Projects" subtitle="Grouped automatically from your conversations" />
      <div className="space-y-3">
        {projects.map((p, n) => {
          const mine = items.filter((i) => i.projectId === p.id);
          const open = openItems(mine).filter((i) => i.kind !== "waiting").length;
          const waiting = openItems(mine).filter((i) => i.kind === "waiting").length;
          const overdue = mine.filter(isOverdue).length;
          return (
            <Link
              key={p.id}
              to="/app/projects/$projectId"
              params={{ projectId: p.id }}
              style={{ animationDelay: `${n * 40}ms` }}
              className="rise card-soft block p-5 transition-shadow hover:shadow-lift"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-[16px] font-semibold">{p.name}</h3>
                  <p className="mt-1.5 line-clamp-1 text-[13px] text-muted-foreground">
                    {p.description}
                  </p>
                </div>
                <div className="flex shrink-0 gap-5 text-[12.5px]">
                  <span className="text-center">
                    <b className="block text-[18px] font-bold leading-none">{open}</b>
                    <span className="mt-1 block text-muted-foreground">open</span>
                  </span>
                  <span className="text-center">
                    <b className="block text-[18px] font-bold leading-none">{waiting}</b>
                    <span className="mt-1 block text-muted-foreground">waiting</span>
                  </span>
                  <span className="text-center">
                    <b
                      className={
                        "block text-[18px] font-bold leading-none " +
                        (overdue > 0 ? "text-destructive" : "")
                      }
                    >
                      {overdue}
                    </b>
                    <span className="mt-1 block text-muted-foreground">overdue</span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
