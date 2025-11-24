import Link from "next/link";
import { adminLinks } from "@/data/admin-links";

const highlights = [
  { label: "Open Approvals", value: "3", tone: "text-amber-700 bg-amber-50" },
  { label: "Items Offline", value: "2", tone: "text-rose-700 bg-rose-50" },
  { label: "Active Users", value: "18", tone: "text-emerald-700 bg-emerald-50" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <section
        className="rounded-3xl border bg-[var(--surface)] p-8 shadow-sm"
        style={{
          borderColor: "var(--border)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
          Admin Dashboard
        </p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold md:text-4xl">
              Control center
            </h1>
            <p className="text-base text-[var(--text-secondary)]">
              Jump straight into user management or equipment operations. These
              links stay under admin-only access.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {highlights.map((item) => (
              <span
                key={item.label}
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide ${item.tone}`}
              >
                {item.label}: {item.value}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {adminLinks.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group rounded-3xl border bg-[var(--surface)] p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            style={{
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-soft)",
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                {card.category}
              </p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  card.accent ?? "bg-[var(--surface-muted)] text-[var(--text-secondary)]"
                }`}
              >
                Admin only
              </span>
            </div>
            <h2 className="mt-3 font-heading text-2xl font-bold text-[var(--text-primary)]">
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {card.description}
            </p>
            <div className="mt-4 flex items-center justify-between text-sm font-semibold text-[var(--secondary)]">
              <span>{card.meta}</span>
              <span className="flex items-center gap-2">
                Open
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 transition group-hover:translate-x-1"
                >
                  <path
                    d="m9 18 6-6-6-6"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
