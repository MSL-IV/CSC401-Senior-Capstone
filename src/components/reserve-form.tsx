"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import {
  easternDateInputValue,
  formatInEastern,
  zonedDateToUtc,
} from "@/utils/time";
import { hasMachineCertificate } from "@/utils/training-machines";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
type Equip = {
  id: string;
  name: string;
  machineUrl: string;
  slotMinutes: number;
  openTime: string;
  closeTime: string;
};

type ReservationItem = {
  id: string;
  title: string;
  date: string;
  time: string;
};
export default function ReserveForm({
  equipment = [],
  onReservationCreated,
}: {
  equipment?: Equip[];
  onReservationCreated?: () => void;
}) {
  const hasEquipment = equipment && equipment.length > 0;

  const [date, setDate] = useState(() => easternDateInputValue());
  const [machineId, setMachineId] = useState("");
  const machine = useMemo(
    () => equipment.find((e) => e.id === machineId) ?? null,
    [machineId, equipment],
  );

  const [startHour, setStartHour] = useState("9");
  const [startMinute, setStartMinute] = useState("00");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");
  const [durationValue, setDurationValue] = useState(30);
  const [durationUnit, setDurationUnit] = useState<"min" | "hr">("min");
  const durationMin = useMemo(() => {
    const v = Number(durationValue);
    if (!Number.isFinite(v) || v <= 0) return 0;
    return durationUnit === "hr" ? v * 60 : v;
  }, [durationValue, durationUnit]);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState<string | null>(
    null,
  );
  const [reservations, setReservations] = useState<ReservationItem[]>([]);
  const [machineReservations, setMachineReservations] = useState<
    { start: string; end: string }[]
  >([]);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [checkingTraining, setCheckingTraining] = useState(true);

  const supabase = useMemo(() => createBrowserClient(), []);
  const timelineData = useMemo(() => {
    if (!machine || !date) return null;

    const open = zonedDateToUtc(date, machine.openTime ?? "09:00:00");
    const close = zonedDateToUtc(date, machine.closeTime ?? "17:00:00");

    const totalMinutes = (close.getTime() - open.getTime()) / 60000;
    if (totalMinutes <= 0) return null;

    const blocks = machineReservations.map((r) => {
      const start = new Date(r.start);
      const end = new Date(r.end);

      const startOffsetMin = (start.getTime() - open.getTime()) / 60000;
      const endOffsetMin = (end.getTime() - open.getTime()) / 60000;

      return {
        start,
        end,
        startOffsetMin,
        endOffsetMin,
        durationMin: (end.getTime() - start.getTime()) / 60000,
        topPct: (startOffsetMin / totalMinutes) * 100,
        heightPct: ((endOffsetMin - startOffsetMin) / totalMinutes) * 100,
      };
    });

    return {
      open,
      close,
      totalMinutes,
      blocks,
    };
  }, [machine, date, machineReservations]);
  const selectedPreview = useMemo(() => {
    if (!machine || !date || !durationMin) return null;

    const startTime24 = to24Hour(startHour, startMinute, startPeriod);
    const start = zonedDateToUtc(date, `${startTime24}:00`);
    const end = new Date(start.getTime() + durationMin * 60000);

    const open = zonedDateToUtc(date, machine.openTime ?? "09:00:00");
    const close = zonedDateToUtc(date, machine.closeTime ?? "17:00:00");

    const totalMinutes = (close.getTime() - open.getTime()) / 60000;
    if (totalMinutes <= 0) return null;

    const startOffsetMin = (start.getTime() - open.getTime()) / 60000;
    const endOffsetMin = (end.getTime() - open.getTime()) / 60000;

    return {
      topPct: (startOffsetMin / totalMinutes) * 100,
      heightPct: ((endOffsetMin - startOffsetMin) / totalMinutes) * 100,
    };
  }, [machine, date, startHour, startMinute, startPeriod, durationMin]);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const didInitUrlSync = useRef(false);
  const trainingReqId = useRef(0);

  useEffect(() => {
    const machineURL = searchParams.get("machine");
    if (!machineURL) return;

    const match = equipment.find((m) => m.machineUrl === machineURL);
    if (!match) return;

    if (match.id !== machineId) {
      setMachineId(match.id);
      setCheckingTraining(true);
      setIsAuthorized(null);
      checkTraining(match.name);
      setMessage("");
    }
  }, [searchParams, equipment, machineId]);

  useEffect(() => {
    let active = true;
    const loadReservations = async () => {
      setReservationsLoading(true);
      setReservationsError(null);
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        if (!active) return;
        setReservations([]);
        setReservationsLoading(false);
        setReservationsError(null);
        return;
      }

      const { data, error } = await supabase
        .from("reservations")
        .select("reservation_id, machine, start, end")
        .eq("user_id", user.id)
        .order("start", { ascending: false })
        .limit(10);

      if (!active) return;

      if (error) {
        setReservationsError("Unable to load reservations right now.");
        setReservations([]);
      } else {
        const mapped =
          data?.map((res) => {
            const startDate = new Date(res.start as string);
            const endDate = res.end ? new Date(res.end as string) : null;
            const dateLabel = formatInEastern(startDate, {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            const timeLabel = `${formatInEastern(startDate, {
              hour: "numeric",
              minute: "2-digit",
            })}${
              endDate
                ? ` - ${formatInEastern(endDate, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}`
                : ""
            }`;
            return {
              id: String(
                res.reservation_id ?? res.start ?? crypto.randomUUID(),
              ),
              title: res.machine ?? "Reservation",
              date: dateLabel,
              time: timeLabel,
            } satisfies ReservationItem;
          }) ?? [];
        setReservations(mapped);
      }
      setReservationsLoading(false);
    };

    loadReservations();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function checkTraining(machineName: string) {
    const reqId = ++trainingReqId.current;

    setCheckingTraining(true);
    setIsAuthorized(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (reqId !== trainingReqId.current) return false;

    if (!user) {
      setIsAuthorized(false);
      setCheckingTraining(false);
      return false;
    }

    const { data, error } = await supabase
      .from("training_certificates")
      .select("expires_at, machine_name")
      .eq("user_id", user.id);

    if (reqId !== trainingReqId.current) return false;

    if (error) {
      console.error("Training check error:", error);
      setIsAuthorized(false);
      setCheckingTraining(false);
      return false;
    }

    const hasValidCert = hasMachineCertificate(machineName, data ?? []);

    if (reqId !== trainingReqId.current) return false;

    setIsAuthorized(hasValidCert);
    setCheckingTraining(false);
    return hasValidCert;
  }
  useEffect(() => {
    const loadMachineReservations = async () => {
      if (!machine || !machineId || !date) return;

      const startOfDay = zonedDateToUtc(date, "00:00:00").toISOString();
      const endOfDay = zonedDateToUtc(date, "23:59:59").toISOString();

      const { data, error } = await supabase
        .from("reservations")
        .select("start, end")
        .eq("machine", machine.name)
        .gte("start", startOfDay)
        .lte("start", endOfDay);

      if (error) {
        console.error("Error loading machine reservations:", error);
        setMachineReservations([]);
      } else {
        setMachineReservations(
          (data as { start: string; end: string }[]) || [],
        );
      }
    };

    loadMachineReservations();
  }, [machineId, date, supabase, machine]);
  function to24Hour(hourStr: string, minuteStr: string, period: "AM" | "PM") {
    let h = Number(hourStr);
    let m = Number(minuteStr);

    if (!Number.isFinite(h) || h < 1 || h > 12) h = 12;
    if (!Number.isFinite(m) || m < 0 || m > 59) m = 0;

    if (period === "AM") {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }

    const hh = String(h).padStart(2, "0");
    const mm = String(m).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!date || !machineId || !machine) {
      setMessage("Please choose a date and equipment.");
      return;
    }

    if (!startHour || !startMinute || !startPeriod || durationMin <= 0) {
      setMessage("Please choose a start time and duration.");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setMessage("You must be logged in to make a reservation.");
        return;
      }
      const eqName = machine?.name ?? "Machine";
      const startTime24 = to24Hour(startHour, startMinute, startPeriod);
      const start = zonedDateToUtc(date, `${startTime24}:00`);
      const end = new Date(start.getTime() + durationMin * 60_000);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        setMessage("Invalid start time or duration.");
        return;
      }
      const open = zonedDateToUtc(date, machine.openTime ?? "09:00:00");
      const close = zonedDateToUtc(date, machine.closeTime ?? "17:00:00");

      if (start < open) {
        setMessage("Start time is before the machine opens.");
        return;
      }
      if (end > close) {
        setMessage("This reservation would end after closing time.");
        return;
      }
      if (end <= start) {
        setMessage("End time must be after start time.");
        return;
      }
      if (date === easternDateInputValue() && end < new Date()) {
        setMessage("That reservation time is in the past.");
        return;
      }
      const overlapsExisting = machineReservations.some((r) => {
        const rStart = new Date(r.start);
        const rEnd = new Date(r.end);
        return start < rEnd && end > rStart;
      });

      if (overlapsExisting) {
        setMessage(
          "That time overlaps an existing reservation. Try another time.",
        );
        return;
      }
      const startISO = start.toISOString();
      const endISO = end.toISOString();
      const duration = durationMin;
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .single();

      const displayName =
        profile?.first_name || profile?.last_name
          ? `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim()
          : (user.user_metadata?.full_name as string | undefined) ||
            (user.user_metadata?.first_name as string | undefined) ||
            user.email;

      const email = profile?.email ?? user.email ?? null;

      const { data: inserted, error } = await supabase
        .from("reservations")
        .insert([
          {
            user_id: user.id,
            machine: eqName,
            start: startISO,
            end: endISO,
            duration,
            name: displayName || null,
            email,
          },
        ])
        .select("reservation_id, machine, start, end")
        .single();

      if (error) {
        console.error("Insert error:", error);

        if (
          error.message?.includes("reservations_no_overlap") ||
          error.details?.includes("reservations_no_overlap")
        ) {
          setMessage(
            "That time slot is already booked for this machine. Please choose another time.",
          );
          return;
        }

        setMessage(`Failed to create reservation: ${error.message}`);
        return;
      }

      const fmt = (d: Date) =>
        formatInEastern(d, { hour: "numeric", minute: "2-digit" });
      const fmtDate = (d: Date) =>
        formatInEastern(d, {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

      setMessage(
        `✅ Reserved ${eqName} on ${fmtDate(start)} from ${fmt(start)} to ${fmt(end)}`,
      );
      if (inserted) {
        const insertedStart = new Date(inserted.start);
        const insertedEnd = inserted.end ? new Date(inserted.end) : null;
        const dateLabel = fmtDate(insertedStart);
        const timeLabel = `${fmt(insertedStart)}${
          insertedEnd ? ` - ${fmt(insertedEnd)}` : ""
        }`;

        setReservations((prev) => [
          {
            id: String(
              inserted.reservation_id ?? inserted.start ?? crypto.randomUUID(),
            ),
            title: inserted.machine ?? eqName,
            date: dateLabel,
            time: timeLabel,
          },
          ...prev,
        ]);
        onReservationCreated?.();
      }
    } finally {
      setLoading(false);
    }
  }

  if (!hasEquipment) {
    return (
      <div className="text-sm text-gray-500">
        No equipment available yet. Please check back later.
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Date</span>
          <input
            type="date"
            value={date}
            min={easternDateInputValue()}
            onChange={(e) => {
              const newDate = e.target.value;
              const day = new Date(newDate).getDay();

              if (day === 5 || day === 6) {
                setMessage("Reservations are not available on weekends.");
                return;
              }

              setDate(newDate);
              setMessage("");
            }}
            className="rounded-md border p-2"
          />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm font-medium">Reserve</span>
          <select
            value={machineId}
            onChange={async (e) => {
              const newId = e.target.value;

              setMachineId(newId);
              setMessage("");
              setCheckingTraining(true);
              setIsAuthorized(null);

              const m = equipment.find((x) => x.id === newId);
              if (!m) {
                setIsAuthorized(false);
                setCheckingTraining(false);
                return;
              }

              const params = new URLSearchParams(searchParams.toString());
              params.set("machine", m.machineUrl);
              router.replace(`${pathname}?${params.toString()}`, {
                scroll: false,
              });

              await checkTraining(m.name);
            }}
            className="rounded-md border p-2"
          >
            <option value="" disabled>
              Select a machine...
            </option>
            {equipment.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        {isAuthorized === false && (
          <p className="text-red-600 text-sm mb-4 sm:col-span-3">
            {" "}
            You are not authorized to use this machine. Complete required
            training first.
          </p>
        )}
        {checkingTraining && (
          <p className="text-gray-500 text-sm mb-4 sm:col-span-3">
            {" "}
            Checking training status…
          </p>
        )}
        <div className="border-t border-gray-200 pt-4 sm:col-span-3" />{" "}
        {timelineData && (
          <div className="space-y-2 sm:col-span-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Daily availability</span>
              <span className="text-xs text-gray-500">
                {formatInEastern(timelineData.open, {
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                –{" "}
                {formatInEastern(timelineData.close, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* horizontal time labels */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {formatInEastern(timelineData.open, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
              <span>
                {formatInEastern(
                  new Date(
                    (timelineData.open.getTime() +
                      timelineData.close.getTime()) /
                      2,
                  ),
                  { hour: "numeric", minute: "2-digit" },
                )}
              </span>
              <span>
                {formatInEastern(timelineData.close, {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            </div>

            {/* horizontal timeline */}
            <div className="relative h-10 w-full overflow-hidden rounded-lg border bg-green-50">
              {/* booked reservations */}
              {timelineData.blocks.map((block, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 bg-red-300 border-x border-red-400 opacity-80"
                  style={{
                    left: `${block.topPct}%`,
                    width: `${block.heightPct}%`,
                  }}
                  title={`${formatInEastern(block.start, {
                    hour: "numeric",
                    minute: "2-digit",
                  })} - ${formatInEastern(block.end, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}`}
                />
              ))}

              {/* selected preview */}
              {selectedPreview && (
                <div
                  className="absolute top-0 bottom-0 bg-blue-400/50 border-x border-blue-500 pointer-events-none"
                  style={{
                    left: `${selectedPreview.topPct}%`,
                    width: `${selectedPreview.heightPct}%`,
                  }}
                />
              )}
            </div>

            <div className="flex gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded bg-green-50 border" />
                Available
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded bg-red-300 border border-red-400" />
                Booked
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block h-3 w-3 rounded bg-blue-400/50 border border-blue-500" />
                Your selection
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* START TIME */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Start time</span>

          <div className="flex gap-2">
            <input
              inputMode="numeric"
              value={startHour}
              onChange={(e) => {
                setStartHour(e.target.value.replace(/\D/g, "").slice(0, 2));
                setMessage("");
              }}
              placeholder="9"
              className="w-16 rounded-md border p-2"
              disabled={checkingTraining || isAuthorized === false}
            />

            <span className="self-center">:</span>

            <input
              inputMode="numeric"
              value={startMinute}
              onChange={(e) => {
                setStartMinute(e.target.value.replace(/\D/g, "").slice(0, 2));
                setMessage("");
              }}
              placeholder="00"
              className="w-16 rounded-md border p-2"
              disabled={checkingTraining || isAuthorized === false}
            />

            <select
              value={startPeriod}
              onChange={(e) => {
                setStartPeriod(e.target.value as "AM" | "PM");
                setMessage("");
              }}
              className="rounded-md border p-2"
              disabled={checkingTraining || isAuthorized === false}
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>

          <span className="text-xs text-gray-500">Example: 9 : 30 PM</span>
        </div>

        {/* DURATION */}
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Duration</span>

          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              value={durationValue}
              onChange={(e) => {
                setDurationValue(Number(e.target.value));
                setMessage("");
              }}
              className="w-28 rounded-md border p-2"
              disabled={checkingTraining || isAuthorized === false}
            />

            <select
              value={durationUnit}
              onChange={(e) => {
                setDurationUnit(e.target.value as "min" | "hr");
                setMessage("");
              }}
              className="rounded-md border p-2"
              disabled={checkingTraining || isAuthorized === false}
            >
              <option value="min">mins</option>
              <option value="hr">hrs</option>
            </select>
          </div>

          {/* optional: show the final minutes */}
          <span className="text-xs text-gray-500">
            Total: {durationMin} minutes
          </span>
        </div>
      </div>
      <button
        type="submit"
        disabled={loading || isAuthorized === false || checkingTraining}
        className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow transition hover:brightness-90"
        style={{
          backgroundColor: "var(--primary)",
          boxShadow: "var(--shadow-soft)",
        }}
      >
        {loading ? "Reserving…" : "RESERVE"}
      </button>

      {message && <p className="text-sm">{message}</p>}
    </form>
  );
}
