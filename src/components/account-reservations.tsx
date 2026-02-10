"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient as createBrowserClient } from "@/utils/supabase/client";

type ReservationDisplay = {
  reservationId: string;
  title: string;
  date: string;
  time: string;
};

export function AccountReservations({
  initialReservations,
  userId,
  showCancel = false,
  showChange = false,
}: {
  initialReservations: ReservationDisplay[];
  userId: string;
  showCancel?: boolean;
  showChange?: boolean;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [reservations, setReservations] = useState<ReservationDisplay[]>(initialReservations);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const cancelFromUrl = searchParams?.get("cancel") === "1";
  const changeFromUrl = searchParams?.get("change") === "1";
  const canCancel = showCancel || cancelFromUrl;
  const canChange = showChange || changeFromUrl;
  const [changingId, setChangingId] = useState<string | null>(null);

  const handleCancel = async (reservationId: string) => {
    setError(null);
    setBusyId(reservationId);
    const { error: deleteError } = await supabase
      .from("reservations")
      .delete()
      .eq("reservation_id", reservationId)
      .eq("user_id", userId);

    if (deleteError) {
      setError("Unable to cancel this reservation. Please try again.");
      setBusyId(null);
      return;
    }

    setReservations((prev) => prev.filter((r) => r.reservationId !== reservationId));
    setBusyId(null);
  };

  if (!reservations || reservations.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
        You have no reservations yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}
      {reservations.map((res) => (
        <div
          key={res.reservationId}
          className="flex flex-col gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p className="font-semibold text-[var(--text-primary)]">{res.title}</p>
            <p className="text-sm text-[var(--text-secondary)]">
              {res.date} • {res.time}
            </p>
          </div>
          {canChange ? (
            <button
              type="button"
              onClick={() => setChangingId((prev) => (prev === res.reservationId ? null : res.reservationId))}
              className="self-start rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--secondary)] transition hover:bg-[var(--surface-muted)]"
            >
              {changingId === res.reservationId ? "Close" : "Change"}
            </button>
          ) : null}
          {canCancel ? (
            <button
              type="button"
              onClick={() => handleCancel(res.reservationId)}
              disabled={busyId === res.reservationId}
              className="self-start rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold uppercase tracking-wide text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
            >
              {busyId === res.reservationId ? "Cancelling..." : "Cancel"}
            </button>
          ) : null}
          {changingId === res.reservationId && (
            <div className="mt-2 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-secondary)]">
              To change a reservation, select a new time slot on the Reserve page and book again. You can cancel the old one here after rebooking.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
