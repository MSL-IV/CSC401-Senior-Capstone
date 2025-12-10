import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { AccountReservations } from "@/components/account-reservations";
import { formatInEastern } from "@/utils/time";

type Profile = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  student_id?: string | null;
};
type TrainingCertificate = {
  id: string;
  machine_name: string | null;
  completed_at: string | null;
  expires_at: string | null;
  issued_by: string | null;
  score: number | null;
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined } | Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email, student_id")
    .eq("id", user.id)
    .single();

  const { data: reservations } = await supabase
    .from("reservations")
    .select("reservation_id, machine, start, end, duration")
    .eq("user_id", user.id)
    .order("start", { ascending: false })
    .limit(10);

  const { data: trainingCerts } = await supabase
    .from("training_certificates")
    .select("id, machine_name, completed_at, expires_at, issued_by, score")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  const formatReservation = (entry: { id: string; machine: string | null; start: string; end: string }) => {
    const startDate = new Date(entry.start);
    const endDate = entry.end ? new Date(entry.end) : null;
    const dateLabel = formatInEastern(startDate, { month: "short", day: "numeric", year: "numeric" });
    const timeLabel = `${formatInEastern(startDate, { hour: "numeric", minute: "2-digit" })}${
      endDate ? ` - ${formatInEastern(endDate, { hour: "numeric", minute: "2-digit" })}` : ""
    }`;
    return {
      id: entry.id,
      title: entry.machine ?? "Reservation",
      date: dateLabel,
      time: timeLabel,
    };
  };

  const reservationsList =
    reservations?.map((res) => ({
      ...formatReservation({
        id: String(res.reservation_id ?? res.start ?? res.machine ?? crypto.randomUUID()),
        machine: res.machine ?? null,
        start: res.start as string,
        end: res.end as string,
      }),
      reservationId: res.reservation_id ?? res.start ?? res.machine ?? crypto.randomUUID(),
    })) ?? [];

  const certifications =
    trainingCerts?.map((cert) => ({
      id: cert.id,
      name: cert.machine_name ?? "Training",
      status: cert.completed_at ? "Completed" : "Pending",
      date: cert.completed_at
        ? formatInEastern(new Date(cert.completed_at), {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : "—",
      score: cert.score,
    })) ?? [];

  const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
  const showCancel = resolvedParams?.cancel === "1";
  const showChange = resolvedParams?.change === "1";

  const fullName =
    profile?.first_name || profile?.last_name
      ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
      : user.user_metadata?.full_name || user.email;

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--background)", color: "var(--text-primary)" }}
    >
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            Account
          </p>
          <h1 className="font-heading text-3xl font-bold md:text-4xl">My Account</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Manage your profile details, training certifications, and upcoming reservations.
          </p>
        </header>

        <section
          className="grid gap-6 lg:grid-cols-3"
          style={{ alignItems: "start" }}
        >
          <div className="space-y-4 rounded-3xl border bg-[var(--surface)] p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  Profile
                </p>
                <h2 className="font-heading text-xl font-semibold">{fullName}</h2>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  Email (view only)
                </p>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                  {profile?.email ?? user.email}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  Student ID (view only)
                </p>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                  {profile?.student_id ?? "N/A"}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  First name
                </p>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                  {profile?.first_name ?? "—"}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                  Last name
                </p>
                <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
                  {profile?.last_name ?? "—"}
                </div>
              </div>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              To update email or student ID, please contact the university. Name updates can be handled by an admin if needed.
            </p>
          </div>

          <div className="space-y-4 rounded-3xl border bg-[var(--surface)] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              Quick Actions
            </p>
            <div className="space-y-3">
              <Link
                  href="/reset-password"
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                Change password
              </Link>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                Sign out everywhere (coming soon)
              </div>
              <Link
                href="/account?cancel=1#reservations"
                className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--secondary)] transition hover:bg-[var(--surface-muted)]"
              >
                Cancel a reservation
              </Link>
              <Link
                href="/account?change=1#reservations"
                className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold text-[var(--secondary)] transition hover:bg-[var(--surface-muted)]"
              >
                Change a reservation
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-3xl border bg-[var(--surface)] p-6 shadow-sm" id="certifications">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  Training Certifications
                </p>
                <h2 className="font-heading text-xl font-semibold">Your certifications</h2>
              </div>
            </div>
            {certifications.length === 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                No training certificates yet. Complete a training to unlock access.
              </div>
            ) : (
              <div className="space-y-3">
                {certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3"
                  >
                    <p className="font-semibold text-[var(--text-primary)]">{cert.name}</p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {cert.status} • {cert.date}
                      {cert.score ? ` • Score ${cert.score}%` : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4 rounded-3xl border bg-[var(--surface)] p-6 shadow-sm" id="reservations">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                  Reservations
                </p>
                <h2 className="font-heading text-xl font-semibold">Your reservations</h2>
              </div>
            </div>
            <AccountReservations
              initialReservations={reservationsList}
              userId={user.id}
              showCancel={showCancel}
              showChange={showChange}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
