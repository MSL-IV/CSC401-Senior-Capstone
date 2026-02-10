"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/utils/supabase/client";
import { formatInEastern } from "@/utils/time";

type Machine = {
  id: string;
  name: string;
  description?: string;
  location?: string;
  slot_minutes: number;
  open_time?: string;
  close_time?: string;
  active: boolean;
  created_at?: string;
};

type Reservation = {
  reservation_id: number;
  name: string;
  email: string;
  start: string;
  end: string;
  machine: string;
  user_id: string;
};

type EquipmentStatus = {
  id: string;
  name: string;
  status: "Available" | "In Use" | "Maintenance";
  statusDetail: string;
  description: string;
};

type EquipmentRow = {
  id: string;
  name: string;
  description?: string | null;
  location?: string | null;
  active?: boolean | null;
  status?: string | null;
  notes?: string | null;
};

type EquipmentCheckout = {
  id: string;
  equipment_id: string | null;
  name: string;
  status: string | null;
  user_id: string | null;
  notes?: string | null;
  created_at?: string | null;
  returned_at?: string | null;
};

const supabase = createClient();

const isUuid = (value: string | undefined | null) =>
  Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
      )
  );

const EQUIPMENT_PLACEHOLDER: EquipmentStatus[] = [
  {
    id: "placeholder-heat-gun",
    name: "Heat Gun",
    status: "Available",
    statusDetail: "Ready to check out",
    description: "Adjustable heat gun for shrink-wrap and soft plastics.",
  },
  {
    id: "placeholder-clamp-set",
    name: "Clamp Set",
    status: "Available",
    statusDetail: "See front desk to borrow",
    description: "Assorted C-clamps and quick clamps for workholding.",
  },
  {
    id: "placeholder-multimeter",
    name: "Multimeter",
    status: "Available",
    statusDetail: "Checked out — due back at close",
    description: "Digital meter for voltage, continuity, and resistance.",
  },
  {
    id: "placeholder-safety-glasses",
    name: "Safety Glasses Bin",
    status: "Available",
    statusDetail: "Help yourself; please return after use",
    description: "ANSI-rated eye protection in assorted sizes.",
  },
  {
    id: "placeholder-oscilloscope",
    name: "Oscilloscope",
    status: "Available",
    statusDetail: "Calibration scheduled this week",
    description: "2-channel scope for quick signal checks.",
  },
];

export function EquipmentStatus() {
  const [machineStatuses, setMachineStatuses] = useState<EquipmentStatus[]>([]);
  const [equipmentStatuses, setEquipmentStatuses] = useState<EquipmentStatus[]>([]);
  const [checkouts, setCheckouts] = useState<EquipmentCheckout[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [otherName, setOtherName] = useState("");
  const [otherError, setOtherError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load current user once
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    }).catch(() => setUserId(null));

    async function fetchMachinesAndReservations() {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();

        const [
          { data: machines, error: machinesError },
          { data: reservations, error: reservationsError },
          { data: equipment, error: equipmentError },
          { data: checkoutRows, error: checkoutError },
        ] = await Promise.all([
          supabase.from("machines").select("*").order("name"),
          supabase
            .from("reservations")
            .select("*")
            .gte("end", now.toISOString())
            .order("start"),
          supabase.from("equipment").select("*").order("name"),
          supabase.from("equipment_in_use").select("*").order("created_at", { ascending: false }),
        ]);

        if (machinesError) {
          setError("Failed to fetch machines: " + machinesError.message);
          return;
        }
        if (reservationsError) {
          setError("Failed to fetch reservations: " + reservationsError.message);
          return;
        }
        if (equipmentError) {
          console.error("Equipment fetch error:", equipmentError.message);
        }
        if (checkoutError) {
          console.error("Checkout fetch error:", checkoutError.message);
        }

        const machineStatusList: EquipmentStatus[] = (machines || []).map(
          (machine: Machine) => {
            if (!machine.active) {
              return {
                id: machine.id,
                name: machine.name,
                status: "Maintenance",
                statusDetail: "Machine is currently offline",
                description: machine.description || "No description available",
              };
            }

            const currentReservation = (reservations || []).find(
              (res: Reservation) =>
                res.machine === machine.name &&
                new Date(res.start) <= now &&
                new Date(res.end) > now
            );

            if (currentReservation) {
              const endTime = new Date(currentReservation.end);
              const minutesLeft = Math.round(
                (endTime.getTime() - now.getTime()) / (1000 * 60)
              );
              return {
                id: machine.id,
                name: machine.name,
                status: "In Use",
                statusDetail: `Estimated completion in ${minutesLeft} minutes`,
                description: machine.description || "No description available",
              };
            }

            const nextReservation = (reservations || []).find(
              (res: Reservation) =>
                res.machine === machine.name && new Date(res.start) > now
            );

            if (nextReservation) {
              const startTime = new Date(nextReservation.start);
              const timeString = formatInEastern(startTime, {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              });
              return {
                id: machine.id,
                name: machine.name,
                status: "Available",
                statusDetail: `Next reservation starts at ${timeString}`,
                description: machine.description || "No description available",
              };
            }

            return {
              id: machine.id,
              name: machine.name,
              status: "Available",
              statusDetail: "No upcoming reservations",
              description: machine.description || "No description available",
            };
          }
        );

        const activeCheckouts = (checkoutRows || []).filter((row: EquipmentCheckout) => row.status !== "returned");
        setCheckouts(activeCheckouts as EquipmentCheckout[]);

        const equipmentStatusList: EquipmentStatus[] = (equipment || []).map(
          (item: EquipmentRow) => {
            const matchingCheckout = activeCheckouts.find(
              (c: EquipmentCheckout) =>
                (c.equipment_id && c.equipment_id === item.id) ||
                c.name?.toLowerCase() === item.name.toLowerCase()
            );

            const normalized = (item.status || "").toLowerCase();

            const derivedStatus: EquipmentStatus["status"] =
              matchingCheckout
                ? "In Use"
                : item.active === false
                ? "Maintenance"
                : normalized.includes("use")
                ? "In Use"
                : "Available";

            let statusDetail = "Ready to use";
            if (derivedStatus === "Maintenance") statusDetail = "Temporarily unavailable";
            if (derivedStatus === "In Use") {
              if (matchingCheckout) {
                const isMine = matchingCheckout.user_id && matchingCheckout.user_id === userId;
                statusDetail = isMine ? "Checked out by you" : "Currently checked out";
              } else {
                statusDetail = "Currently checked out";
              }
            }
            if (item.notes) statusDetail = item.notes;

            return {
              id: item.id,
              name: item.name,
              status: derivedStatus,
              statusDetail,
              description: item.description || "No description available",
            };
          }
        );

        setMachineStatuses(machineStatusList);
        // Build display list: catalog (or placeholders) overlaid with active checkouts
        const baseList =
          equipment && equipment.length > 0 ? equipmentStatusList : EQUIPMENT_PLACEHOLDER;

        const overlayed = baseList.map((item) => {
          const matchingCheckout = activeCheckouts.find(
            (c) =>
              (c.equipment_id && c.equipment_id === item.id) ||
              c.name?.toLowerCase() === item.name.toLowerCase()
          );
          if (matchingCheckout) {
            const isMine = matchingCheckout.user_id && matchingCheckout.user_id === userId;
            return {
              ...item,
              status: "In Use" as const,
              statusDetail: isMine ? "Checked out by you" : "Currently checked out",
            };
          }
          return item;
        });

        // Add any "Other" checkouts that aren't in the base list
        activeCheckouts.forEach((c) => {
          const exists = overlayed.some(
            (item) =>
              (c.equipment_id && item.id === c.equipment_id) ||
              item.name.toLowerCase() === c.name.toLowerCase()
          );
          if (!exists) {
            overlayed.push({
              id: c.id,
              name: c.name,
              status: "In Use",
              statusDetail: c.user_id === userId ? "Checked out by you" : "Currently checked out",
              description: c.notes ?? "User-entered item",
            });
          }
        });

        setEquipmentStatuses(overlayed);
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Equipment status fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMachinesAndReservations();
    
    const interval = setInterval(fetchMachinesAndReservations, 30000);
    // Realtime: refetch when equipment or checkouts change in Supabase
    const channel = supabase.channel("equipment-status")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "equipment" },
        () => fetchMachinesAndReservations()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "equipment_in_use" },
        () => fetchMachinesAndReservations()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleCheckout = async (equipment: EquipmentStatus) => {
    if (!userId) {
      setError("Sign in to check out equipment.");
      return;
    }
    const existing = checkouts.find(
      (c) =>
        (c.equipment_id && c.equipment_id === equipment.id) ||
        (!c.equipment_id &&
          equipment.name &&
          c.name?.toLowerCase() === equipment.name.toLowerCase() &&
          c.status !== "returned")
    );
    if (existing) {
      setError("This item is already checked out.");
      return;
    }
    setActionLoading(equipment.id);
    try {
      const { error: insertError, data } = await supabase
        .from("equipment_in_use")
        .insert({
          equipment_id: isUuid(equipment.id) ? equipment.id : null,
          name: equipment.name,
          status: "in_use",
          user_id: userId,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Checkout insert error:", insertError.message);
        setError(`Unable to check out right now. ${insertError.message}`);
        return;
      }

      const newCheckout: EquipmentCheckout = {
        id: data.id,
        equipment_id: data.equipment_id,
        name: data.name,
        status: data.status,
        user_id: data.user_id,
        notes: data.notes,
        created_at: data.created_at,
      };

      setCheckouts((prev) => [newCheckout, ...prev]);
      setEquipmentStatuses((prev): EquipmentStatus[] => {
        const updated: EquipmentStatus[] = prev.map((item) =>
          item.id === equipment.id
            ? {
                ...item,
                status: "In Use" as const,
                statusDetail: "Checked out by you",
              }
            : item
        );
        // If the item was only from placeholders and not in state, add it so UI swaps out of fallback list
        const exists = updated.some((i) => i.id === equipment.id);
        return exists
          ? updated
          : [
              ...updated,
              {
                ...equipment,
                status: "In Use" as const,
                statusDetail: "Checked out by you",
              },
            ];
      });
    } catch (err) {
      console.error("Checkout error:", err);
      setError("Unexpected error during checkout.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturn = async (checkoutId?: string, equipment?: EquipmentStatus) => {
    if (!checkoutId) return;
    if (!userId) {
      setError("Sign in to return equipment.");
      return;
    }
    setActionLoading(equipment?.id ?? checkoutId);
    try {
      const { error: updateError } = await supabase
        .from("equipment_in_use")
        .update({ status: "returned", returned_at: new Date().toISOString() })
        .eq("id", checkoutId);

      if (updateError) {
        console.error("Return update error:", updateError.message);
        setError(`Unable to return right now. ${updateError.message}`);
        return;
      }

      setCheckouts((prev) => prev.filter((c) => c.id !== checkoutId));
      if (equipment) {
        setEquipmentStatuses((prev) =>
          prev.map((item) =>
            item.id === equipment.id
              ? { ...item, status: "Available", statusDetail: "Ready to use" }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Return error:", err);
      setError("Unexpected error during return.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddOther = async () => {
    const name = otherName.trim();
    if (!name) {
      setOtherError("Please enter equipment name.");
      return;
    }
    if (!userId) {
      setOtherError("Sign in to check out equipment.");
      return;
    }
    setOtherError(null);
    setActionLoading("other");

    try {
      const { data, error: insertError } = await supabase
        .from("equipment_in_use")
        .insert({
          equipment_id: null,
          name,
          status: "in_use",
          user_id: userId,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Other checkout error:", insertError.message);
        setOtherError(`Couldn't save. ${insertError.message}`);
        return;
      }

      const newEntry: EquipmentCheckout = {
        id: data.id,
        equipment_id: data.equipment_id,
        name: data.name,
        status: data.status,
        user_id: data.user_id,
        notes: data.notes,
        created_at: data.created_at,
      };
      setCheckouts((prev) => [newEntry, ...prev]);
      setEquipmentStatuses((prev) => [
        ...prev,
        {
          id: data.id,
          name: data.name,
          status: "In Use",
          statusDetail: "Checked out by you",
          description: "User-entered item",
        },
      ]);
      setOtherName("");
    } catch (err) {
      console.error("Other checkout unexpected error:", err);
      setOtherError("Unexpected error. Try again.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--text-primary)",
        }}
      >
        <Navbar />
        <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
            <p>Loading equipment status...</p>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--text-primary)",
        }}
      >
        <Navbar />
        <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="text-red-500 mb-4 text-2xl">⚠️ Error</div>
            <p className="mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition"
            >
              Retry
            </button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--text-primary)",
      }}
    >
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
        <header className="space-y-4 text-center md:text-left">
          <p
            className="font-heading text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--primary)" }}
          >
            Real-time availability
          </p>
          <h1
            className="font-heading text-4xl font-bold tracking-tight md:text-5xl"
            style={{ color: "var(--text-primary)" }}
          >
            Equipment Status
          </h1>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            Check availability, maintenance windows, and upcoming reservations before
            you head to the Makerspace. Status data is refreshed automatically every few
            minutes.
          </p>
        </header>

        <div className="space-y-12">
          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--primary)]">
                  Machines
                </p>
                <h2 className="font-heading text-2xl font-bold">Reservations required</h2>
              </div>
              <span className="text-sm text-[var(--text-secondary)]">
                Live feed from machines + reservations
              </span>
            </div>
            <section className="grid gap-6 md:grid-cols-2">
              {machineStatuses.map((machine) => (
                <article
                  key={machine.id}
                  className="flex flex-col gap-3 border p-5"
                  style={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: "var(--radius-card)",
                    boxShadow: "var(--shadow-soft)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-secondary)]">Machine</p>
                      <h3 className="font-heading text-xl font-semibold">{machine.name}</h3>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        machine.status === "Available"
                          ? "bg-emerald-50 text-emerald-700"
                          : machine.status === "In Use"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {machine.status}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {machine.description}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] font-semibold">
                    {machine.statusDetail}
                  </p>
                </article>
              ))}
              {machineStatuses.length === 0 && (
                <div className="border border-dashed p-6 text-sm text-[var(--text-secondary)] rounded-2xl">
                  No machines found.
                </div>
              )}
            </section>
          </section>

          <section className="space-y-4">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--accent)]">
                  Equipment
                </p>
                <h2 className="font-heading text-2xl font-bold">Check-out & walk-up tools</h2>
              </div>
            </div>
            <section className="space-y-3 rounded-2xl border bg-[var(--surface)] p-4" style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-soft)" }}>
              <div className="grid grid-cols-[1fr,140px,150px] items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] px-2">
                <span>Name</span>
                <span>Status</span>
                <span className="text-right">Action</span>
              </div>
              <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]">
                {(equipmentStatuses.length ? equipmentStatuses : EQUIPMENT_PLACEHOLDER).map((equipment) => {
                  const checkout = checkouts.find(
                    (c) =>
                      (c.equipment_id && c.equipment_id === equipment.id) ||
                      c.name?.toLowerCase() === equipment.name.toLowerCase()
                  );
                  const inUse = equipment.status === "In Use";
                  const isMine = checkout?.user_id && checkout.user_id === userId;

                  return (
                    <div
                      key={equipment.id}
                      className="grid grid-cols-[1fr,140px,150px] items-center gap-3 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{equipment.name}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{equipment.description}</p>
                        {inUse && (
                          <p className="text-xs text-[var(--text-secondary)]">
                            {isMine ? "Checked out by you" : "Checked out"}
                          </p>
                        )}
                      </div>
                      <span
                        className={`justify-self-start rounded-full px-3 py-1 text-[11px] font-semibold ${
                          equipment.status === "Available"
                            ? "bg-emerald-50 text-emerald-700"
                            : equipment.status === "In Use"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-rose-50 text-rose-700"
                        }`}
                      >
                        {equipment.status}
                      </span>
                      <div className="justify-self-end">
                        {inUse ? (
                          <button
                            type="button"
                            disabled={!isMine && Boolean(checkout) || actionLoading === equipment.id}
                            onClick={() => handleReturn(checkout?.id, equipment)}
                            className={`rounded-[var(--radius-button)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white ${
                              actionLoading === equipment.id
                                ? "bg-[var(--primary)]/60"
                                : "bg-rose-500 hover:bg-rose-600"
                            } ${!isMine && checkout ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            {actionLoading === equipment.id ? "Updating..." : isMine ? "Return" : "In Use"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={actionLoading === equipment.id}
                            onClick={() => handleCheckout(equipment)}
                            className={`rounded-[var(--radius-button)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white ${
                              actionLoading === equipment.id
                                ? "bg-[var(--primary)]/60"
                                : "bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
                            }`}
                          >
                            {actionLoading === equipment.id ? "Saving..." : "Check Out"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Other entry */}
                <div className="grid grid-cols-[1fr,140px,150px] items-center gap-3 px-4 py-3 bg-white/60">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)]">
                      Other
                    </label>
                    <input
                      type="text"
                      value={otherName}
                      onChange={(e) => setOtherName(e.target.value)}
                      placeholder="Type equipment name"
                      className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] shadow-inner focus:border-[var(--primary)] focus:outline-none"
                    />
                    {otherError && (
                      <p className="text-xs text-rose-600">{otherError}</p>
                    )}
                  </div>
                  <span className="justify-self-start rounded-full px-3 py-1 text-[11px] font-semibold bg-amber-50 text-amber-700">
                    In Use
                  </span>
                  <div className="justify-self-end">
                    <button
                      type="button"
                      onClick={handleAddOther}
                      disabled={actionLoading === "other"}
                      className={`rounded-[var(--radius-button)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white ${
                        actionLoading === "other" ? "bg-[var(--primary)]/60" : "bg-[var(--primary)] hover:bg-[var(--primary-hover)]"
                      }`}
                    >
                      {actionLoading === "other" ? "Saving..." : "Check Out"}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
