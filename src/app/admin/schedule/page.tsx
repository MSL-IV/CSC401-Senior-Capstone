import { createClient } from "@/utils/supabase/server";
import { formatInEastern } from "@/utils/time";

type Reservation = {
  reservation_id: number;
  machine: string | null;
  start: string;
  end: string;
  duration: number | null;
  user_id: string | null;
};

export default async function AdminSchedulePage() {
  const supabase = await createClient();
  const now = new Date();
  const endRange = new Date();
  endRange.setDate(now.getDate() + 30);

  const { data, error } = await supabase
    .from("reservations")
    .select("reservation_id, machine, start, end, duration, user_id")
    .gte("end", now.toISOString())
    .lte("start", endRange.toISOString())
    .order("start", { ascending: true });

  const reservations = ((data || []) as Reservation[]).map((res) => ({
    ...res,
    startDate: new Date(res.start),
    endDate: res.end ? new Date(res.end) : new Date(res.start),
  }));

  const userIds = Array.from(new Set(reservations.map((r) => r.user_id).filter(Boolean) as string[]));

  const profilesPromise = userIds.length
    ? supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", userIds)
    : Promise.resolve({ data: [] as any[], error: null });

  const certsPromise = userIds.length
    ? supabase
        .from("training_certificates")
        .select("user_id, machine_name, completed_at")
        .in("user_id", userIds)
    : Promise.resolve({ data: [] as any[], error: null });

  const [profilesResponse, certsResponse] = await Promise.all([profilesPromise, certsPromise]);

  const profileMap = new Map<string, { name: string; email: string }>();
  (profilesResponse.data || []).forEach((p: any) => {
    const name =
      [p.first_name, p.last_name].filter(Boolean).join(" ").trim() || p.email || "User";
    profileMap.set(p.id, { name, email: p.email });
  });

  const certMap = new Map<string, { count: number; machines: string[] }>();
  (certsResponse.data || []).forEach((c: any) => {
    const entry = certMap.get(c.user_id) || { count: 0, machines: [] };
    entry.count += 1;
    if (c.machine_name) entry.machines.push(c.machine_name);
    certMap.set(c.user_id, entry);
  });

  const sorted = reservations.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  return (
    <div className="space-y-8">
      <section
        className="rounded-3xl border bg-[var(--surface)] p-6 shadow-sm"
        style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-soft)" }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
          Admin / Schedule
        </p>
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <h1 className="font-heading text-3xl font-bold md:text-4xl">View Schedule</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              Canvas-style dashboard for upcoming reservations across all machines. Showing the next 30 days.
            </p>
          </div>
          <div className="rounded-full bg-[var(--surface-muted)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
            {reservations.length} reservations
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {sorted.length === 0 ? (
          <div className="rounded-3xl border bg-[var(--surface)] p-6 text-sm text-[var(--text-secondary)] shadow-sm">
            No reservations scheduled in the next 30 days.
          </div>
        ) : (
          sorted.map((res) => {
            const profile = res.user_id ? profileMap.get(res.user_id) : null;
            const certs = res.user_id ? certMap.get(res.user_id) : null;
            return (
              <div
                key={res.reservation_id ?? res.start}
                className="rounded-3xl border bg-[var(--surface)] p-5 shadow-sm"
                style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-soft)" }}
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                      {res.machine ?? "Reservation"}
                    </span>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {formatInEastern(res.startDate, { month: "short", day: "numeric", year: "numeric" })} •{" "}
                      {formatInEastern(res.startDate, { hour: "numeric", minute: "2-digit" })} –{" "}
                      {formatInEastern(res.endDate, { hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1">
                      {res.duration ? `${res.duration} mins` : "Scheduled"}
                    </span>
                    {certs && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                        {certs.count} cert{certs.count === 1 ? "" : "s"}
                        {certs.machines.length ? ` • ${certs.machines.join(", ")}` : ""}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-col gap-2 text-sm text-[var(--text-secondary)] md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {profile?.name ?? "Unknown user"}
                    </p>
                    <p>{profile?.email ?? "No email"}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold">
                      User ID: {res.user_id ?? "n/a"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
