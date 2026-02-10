import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { adminLinks } from "@/data/admin-links";
import { isFacultyOrAdmin } from "@/utils/permissions";

type AdminProfile = {
  role?: string | null;
  full_name?: string | null;
};

async function requireAdminOrFaculty() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth?redirectTo=/admin");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || (profile?.role !== "admin" && profile?.role !== "faculty")) {
    redirect("/");
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    [
      user.user_metadata?.first_name as string | undefined,
      user.user_metadata?.last_name as string | undefined,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    user.email;

  return { profile, displayName };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, displayName } = await requireAdminOrFaculty();

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--text-primary)",
      }}
    >
      <header
        className="border-b bg-[var(--surface)]/80 backdrop-blur"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              Admin Access
            </p>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl font-bold">
                Makerspace Admin
              </h1>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                {profile.role}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[var(--text-secondary)]">
            <Link
              href="/"
              className="rounded-full border border-[var(--border)] px-3 py-2 transition hover:border-[var(--secondary)] hover:text-[var(--text-primary)]"
            >
              Back to site
            </Link>
            <Link
              href="/admin"
              className="rounded-full border border-[var(--border)] px-3 py-2 transition hover:border-[var(--secondary)] hover:text-[var(--text-primary)]"
            >
              Overview
            </Link>
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-[var(--border)] px-3 py-2 transition hover:border-[var(--secondary)] hover:text-[var(--text-primary)]"
              >
                {link.title}
              </Link>
            ))}
            <div className="rounded-full bg-[var(--surface-muted)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
              {displayName}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
