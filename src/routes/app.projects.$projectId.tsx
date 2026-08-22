import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { EmptyState, PageHeader, Section } from "@/components/nanti/app-shell";
import { ItemRow } from "@/components/nanti/item-row";
import { useNanti } from "@/lib/nanti-store";
import { formatDate, isOverdue, openItems, waitingDays } from "@/lib/nanti-utils";

export const Route = createFileRoute("/app/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project detail · NANTI" },
      {
        name: "description",
        content: "All tasks, waiting items, people and conversation sources for this project.",
      },
      { property: "og:title", content: "Project detail · NANTI" },
      { property: "og:description", content: "Complete work memory per project." },
    ],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { projectId } = Route.useParams();
  const { projects, items, people } = useNanti();
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return <EmptyState title="Project not found." />;
  }

  const mine = items.filter((i) => i.projectId === project.id);
  const tasks = openItems(mine).filter((i) => i.kind !== "waiting");
  const waiting = openItems(mine).filter((i) => i.kind === "waiting");
  const involved = people.filter((p) => mine.some((i) => i.personId === p.id));

  return (
    <div>
      <Link
        to="/app/projects"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> All projects
      </Link>
      <PageHeader title={project.name} subtitle={project.description} />

      <div className="card-soft mb-8 grid grid-cols-3 gap-3 p-5">
        {[
          { label: "Open", value: tasks.length },
          { label: "Waiting", value: waiting.length },
          { label: "Overdue", value: mine.filter(isOverdue).length },
        ].map((s) => (
          <div key={s.label}>
            <p className="text-[22px] font-bold leading-none">{s.value}</p>
            <p className="mt-1.5 text-[12.5px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <Section title="Tasks" count={tasks.length}>
        {tasks.length ? (
          tasks.map((i, n) => <ItemRow key={i.id} item={i} index={n} />)
        ) : (
          <EmptyState title="No open tasks." />
        )}
      </Section>

      <Section title="Waiting" count={waiting.length}>
        {waiting.length ? (
          waiting.map((i) => (
            <div key={i.id} className="flex items-center justify-between px-3 py-2.5 text-[14px]">
              <span>{i.title}</span>
              <span className="text-[12.5px] text-muted-foreground">{waitingDays(i)} days</span>
            </div>
          ))
        ) : (
          <EmptyState title="Nothing waiting." />
        )}
      </Section>

      <Section title="People" count={involved.length}>
        {involved.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-3 py-2.5 text-[14px]">
            <span>{p.name}</span>
            <span className="text-[12.5px] text-muted-foreground">{p.org}</span>
          </div>
        ))}
      </Section>

      <Section title="Conversation sources">
        <div className="flex flex-wrap gap-2 px-3">
          {project.sources.map((s) => (
            <span
              key={s}
              className="rounded-full bg-secondary px-3 py-1 text-[12.5px] text-secondary-foreground"
            >
              {s}
            </span>
          ))}
        </div>
      </Section>

      <Section title="Recent activity">
        {mine.slice(0, 5).map((i) => (
          <div key={i.id} className="px-3 py-2">
            <p className="text-[13.5px]">{i.aiNote}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {i.source} · {formatDate(i.due ?? i.since)}
            </p>
          </div>
        ))}
      </Section>
    </div>
  );
}
