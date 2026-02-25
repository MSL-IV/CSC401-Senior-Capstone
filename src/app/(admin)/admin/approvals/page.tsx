"use client";

import { useEffect, useState } from "react";
import { createClient as createBrowserClient } from "@/utils/supabase/client";
import { formatInEastern } from "@/utils/time";

type PendingReservation = {
    reservation_id: string | number;
    user_id: string;
    machine: string;
    start: string;
    name: string;
    email: string;
};

export default function ApprovalsPage() {
    const [pending, setPending] = useState<PendingReservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | number | null>(null);
    const supabase = createBrowserClient();

    const fetchPending = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from("reservations")
            .select("reservation_id, user_id, machine, start, name, email")
            .eq("status", "pending")
            .order("start", { ascending: true });

        if (!error) setPending(data || []);
        setLoading(false);
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleApprove = async (res: PendingReservation) => {
        setActionLoading(res.reservation_id);

        const { error: resError } = await supabase
            .from("reservations")
            .update({ status: "confirmed" })
            .eq("reservation_id", res.reservation_id);

        if (resError) {
            alert("Error confirming reservation.");
            setActionLoading(null);
            return;
        }

        const { error: certError } = await supabase
            .from("training_certificates")
            .insert([
                {
                    user_id: res.user_id,
                    machine_name: res.machine,
                    issued_at: new Date().toISOString(),
                },
            ]);

        if (certError) console.error("Cert error:", certError);

        setActionLoading(null);
        await fetchPending();
    };

    if (loading && pending.length === 0) {
        return <p className="text-sm text-[var(--text-secondary)]">Loading pending requests...</p>;
    }

    return (
        <div className="space-y-8">
            <div>
                <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)]">
                    Training Approvals
                </h2>
                <p className="text-sm text-[var(--text-secondary)]">
                    Verify safety training and authorize access for restricted equipment.
                </p>
            </div>

            {pending.length === 0 ? (
                <div
                    className="border-2 border-dashed p-12 text-center"
                    style={{ borderColor: "var(--border)", borderRadius: "var(--radius-card)" }}
                >
                    <p className="text-sm text-[var(--text-secondary)]">No pending approvals at this time.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {pending.map((res) => (
                        <div
                            key={res.reservation_id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 transition-all"
                            style={{
                                backgroundColor: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: "var(--radius-card)",
                                boxShadow: "var(--shadow-soft)"
                            }}
                        >
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                  <span
                      className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded"
                      style={{ backgroundColor: "var(--surface-muted)", color: "var(--primary)" }}
                  >
                    {res.machine}
                  </span>
                                </div>
                                <h3 className="font-heading text-lg font-bold text-[var(--text-primary)] leading-tight">
                                    {res.name}
                                </h3>
                                <div className="text-sm text-[var(--text-secondary)]">
                                    <p>{res.email}</p>
                                    <p className="font-medium text-[var(--text-primary)] mt-1">
                                        Scheduled: {formatInEastern(new Date(res.start), {
                                        month: "short", day: "numeric", hour: "numeric", minute: "2-digit"
                                    })}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleApprove(res)}
                                disabled={actionLoading === res.reservation_id}
                                className="font-bold uppercase tracking-widest px-6 py-3 transition-colors disabled:opacity-50"
                                style={{
                                    backgroundColor: "var(--primary)",
                                    color: "var(--on-primary)",
                                    borderRadius: "var(--radius-button)"
                                }}
                            >
                                {actionLoading === res.reservation_id ? "Saving..." : "Approve Training"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
