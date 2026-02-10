// use http://localhost:3000/training to see
// Add the video and exams later

"use client";

import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type TrainingCertificate = {
    id: string;
    user_id: string;
    machine_name: string;
    completed_at: string | null;
    expires_at: string | null;
    issued_by: string | null;
    score: number | null;
    created_at: string | null;
    updated_at: string | null;
};

type TrainingMachine = {
    id: string;
    name: string;
    slug: string;
    active?: boolean | null;
    needs_training?: boolean | null;
    display_order?: number | null;
};

const FALLBACK_EQUIPMENT: TrainingMachine[] = [
    { id: "laser-cutter", name: "Laser Cutter", slug: "laser-cutter", display_order: 1 },
    { id: "milling-machine", name: "Milling Machine", slug: "milling-machine", display_order: 2 },
    { id: "3d-printer", name: "3D Printer", slug: "3d-printer", display_order: 3 },
    { id: "ultimaker", name: "UltiMaker", slug: "ultimaker", display_order: 4 },
    { id: "heat-press", name: "Heat Press", slug: "heat-press", display_order: 5 },
    { id: "vinyl-cutter", name: "Vinyl Cutter", slug: "vinyl-cutter", display_order: 6 },
    { id: "soldering-station", name: "Soldering Station", slug: "soldering-station", display_order: 7 },
];

const supabase = createClient();

export function Training() {

    const [equipment, setEquipment] = useState<TrainingMachine[]>(FALLBACK_EQUIPMENT);
    const [loadingEquipment, setLoadingEquipment] = useState(false);
    const [selectedEquipment, setSelectedEquipment] = useState("");
    const [activeEquipment, setActiveEquipment] = useState("");
    const [certificateUnlocked, setCertificateUnlocked] = useState(false);
    const [certificate, setCertificate] = useState<TrainingCertificate | null>(null);
    const [loadingCert, setLoadingCert] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [issuedBy, setIssuedBy] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [showCertModal, setShowCertModal] = useState(false);

    useEffect(() => {
        async function loadUser() {
            const { data, error } = await supabase.auth.getUser();
            if (error || !data.user) {
                setError("You need to be signed in to record training.");
                return;
            }
            setUserId(data.user.id);
            setUserEmail(data.user.email ?? null);
            setIssuedBy(data.user.email ?? data.user.id ?? null);
        }
        loadUser();
    }, []);

    useEffect(() => {
        async function loadEquipment() {
            setLoadingEquipment(true);
            const { data, error } = await supabase
                .from("training_machines")
                .select("id, name, slug, active, needs_training, display_order")
                .eq("needs_training", true)
                .order("display_order", { ascending: true });

            if (error) {
                console.error("Failed to load training machines:", error.message);
                setEquipment(FALLBACK_EQUIPMENT);
            } else if (data && data.length > 0) {
                // Prefer explicit ordering, fallback alphabetical
                const sorted = [...data].sort((a, b) => {
                    const ao = a.display_order ?? 999;
                    const bo = b.display_order ?? 999;
                    if (ao === bo) return a.name.localeCompare(b.name);
                    return ao - bo;
                });
                setEquipment(sorted as TrainingMachine[]);
            } else {
                setEquipment(FALLBACK_EQUIPMENT);
            }
            setLoadingEquipment(false);
        }

        loadEquipment();
    }, []);

    useEffect(() => {
        setCertificate(null);
        setCertificateUnlocked(false);
    }, [activeEquipment]);

    useEffect(() => {
        async function fetchCertificate() {
            if (!userId || !activeEquipment) {
                return;
            }
            setLoadingCert(true);
            setError(null);
            const { data, error } = await supabase
                .from("training_certificates")
                .select("*")
                .eq("user_id", userId)
                .eq("machine_name", activeEquipment)
                .order("completed_at", { ascending: false })
                .limit(1);

            if (error) {
                setError("Couldn't fetch training certificate. Please try again.");
            } else {
                const cert = data?.[0] ?? null;
                setCertificate(cert);
                setCertificateUnlocked(Boolean(cert?.completed_at ?? cert?.id));
            }
            setLoadingCert(false);
        }
        fetchCertificate();
    }, [userId, activeEquipment]);

    const handleSearch = () => {
        if (!selectedEquipment) {
            alert("Please select equipment.");
            return;
        }
        setActiveEquipment(selectedEquipment);
        setCertificateUnlocked(false);
    };

    const handleCompleteTraining = async () => {
        if (!userId) {
            setError("You need to be signed in to record training.");
            return;
        }
        if (!activeEquipment) {
            setError("Select equipment before completing training.");
            return;
        }

        setError(null);
        setLoadingCert(true);

        const now = new Date().toISOString();
        const issuedByValue = `${issuedBy ?? "MakerSpace Team"} (Training)`;
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 12);
        const expiresAt = expiry.toISOString();

        const machineName = activeEquipment;

        const newId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;

        // Try update first (if a record exists for this user + machine)
        const { data: updated, error: updateError } = await supabase
            .from("training_certificates")
            .update({
                completed_at: now,
                expires_at: expiresAt,
                issued_by: issuedByValue,
                score: 100, // placeholder score until quiz integration
            })
            .eq("user_id", userId)
            .eq("machine_name", machineName)
            .select();

        let savedCert: TrainingCertificate | null = null;

        if (updateError) {
            console.error("Training certificate update error:", updateError);
        }

        if (updated && updated.length > 0) {
            savedCert = updated[0] as TrainingCertificate;
        } else {
            // No existing record; insert new
            const { data: inserted, error: insertError } = await supabase
                .from("training_certificates")
                .insert({
                    id: newId,
                    user_id: userId,
                    machine_name: machineName,
                    completed_at: now,
                    expires_at: expiresAt,
                    issued_by: issuedByValue,
                    score: 100, // placeholder score until quiz integration
                })
                .select()
                .single();

            if (insertError) {
                console.error("Training certificate insert error:", insertError);
                setError(`Unable to save certificate. ${insertError.message ?? "Please try again."}`);
                setLoadingCert(false);
                return;
            }
            savedCert = inserted as TrainingCertificate;
        }

        setCertificate(savedCert as TrainingCertificate);
        setCertificateUnlocked(true);
        setLoadingCert(false);
    };

    const trainingSteps = [
        {
            title: "Machine Walkthrough",
            detail: "Bed leveling, AMS loading, nozzle prep, and chamber checks for the Bambu Labs workflow.",
        },
        {
            title: "Safety & Readiness",
            detail: "High-temp hotend awareness, ventilation, and first-layer supervision expectations.",
        },
        {
            title: "Print-Ready Workflow",
            detail: "Slice in Bambu Studio, transfer the job, confirm materials, and monitor on the MakerSpace unit.",
        },
    ];

    return (
        <div
            className="min-h-screen"
            style={{
                backgroundColor: "var(--background)",
                color: "var(--text-primary)",
            }}
        >
            <Navbar />
            <main className="mx-auto flex max-w-6xl flex-col items-stretch gap-16 px-6 py-20">
                {/* Main Section */}
                <section
                    className="overflow-hidden rounded-3xl border bg-[var(--surface)] shadow-sm"
                    style={{
                        borderColor: "var(--border)",
                        borderRadius: "var(--radius-card)",
                        boxShadow: "var(--shadow-soft)",
                    }}
                >
                    <div className="px-6 pt-12 md:px-20">
                        <div className="mx-auto max-w-3xl space-y-4">
                            <h1
                                className="font-heading text-4xl font-bold tracking-tight md:text-5xl"
                                style={{ color: "var(--text-primary)" }}
                            >
                                Training
                            </h1>
                            <p
                                className="text-lg leading-relaxed md:text-xl"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                Users must demonstrate proficiency with any equipment or machine before making a reservation.
                                They can either watch the instructional video to learn proper usage and then take the
                                corresponding exam, or, if they are already familiar with the equipment, they may skip the
                                video and go directly to the exam. In either case, users must achieve a score of 80% or
                                higher to gain access.
                            </p>
                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error}
                                </div>
                            )}
                        </div>

                        {/* accent divider */}
                        <div
                            className="mt-8 h-1 w-full rounded-full"
                            style={{
                                backgroundImage:
                                    "linear-gradient(90deg, var(--primary) 0%, var(--accent) 60%, var(--primary-hover) 100%)",
                            }}
                        />
                    </div>

                    {/* Video and Exam Section */}
                    <div className="mx-auto mt-10 px-5 max-w-md pb-12">
                        <label
                            htmlFor="equipment"
                            className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
                        >
                            Select Equipment
                        </label>
                        <select
                            id="equipment"
                            value={selectedEquipment}
                            onChange={(e) => setSelectedEquipment(e.target.value)}
                            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-primary)] shadow-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(200,16,46,0.2)]"
                            disabled={loadingEquipment}
                        >
                            <option value="">{loadingEquipment ? "Loading equipment..." : "-- Choose Equipment --"}</option>
                            {equipment.map((eq) => (
                                <option key={eq.id} value={eq.name}>
                                    {eq.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleSearch}
                            disabled={loadingEquipment}
                            className={`mt-4 w-full rounded-lg bg-[var(--primary)] px-4 py-2 text-white shadow hover:bg-[var(--primary-hover)] ${loadingEquipment ? "opacity-70" : ""}`}
                        >
                            {loadingEquipment ? "Please wait" : "Go"}
                        </button>
                    </div>

                    {activeEquipment && (
                        <div className="border-t border-[var(--border)] bg-gradient-to-b from-[rgba(200,16,46,0.03)] to-[rgba(13,45,75,0.02)] px-6 pb-14 pt-10 md:px-20">
                            {activeEquipment === "3D Printer" ? (
                                <div className="space-y-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
                                                Bambu Labs 3D Printer
                                            </p>
                                            <h2
                                                className="font-heading text-2xl font-bold"
                                                style={{ color: "var(--text-primary)" }}
                                            >
                                                Earn Your 3D Printer Training Certificate
                                            </h2>
                                            <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
                                                Complete the Bambu Labs training flow to unlock reservations for the MakerSpace printer.
                                                Work through the guided steps below, then confirm completion to generate your certificate.
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] shadow-sm">
                                            Approx. 30 minutes
                                        </span>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
                                        <div
                                            className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
                                            style={{ boxShadow: "var(--shadow-soft)" }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 24 24"
                                                        fill="currentColor"
                                                        className="h-6 w-6"
                                                    >
                                                        <path d="M4 6.75A2.75 2.75 0 0 1 6.75 4h2.5a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-.75.75H6.75c-.69 0-1.25.56-1.25 1.25v7.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-7.5c0-.69-.56-1.25-1.25-1.25h-2.5a.75.75 0 0 1-.75-.75v-3a.75.75 0 0 1 .75-.75h2.5A2.75 2.75 0 0 1 20 6.75v10.5A2.75 2.75 0 0 1 17.25 20H6.75A2.75 2.75 0 0 1 4 17.25z" />
                                                        <path d="M9.5 4.75a.75.75 0 0 1 .75-.75h3.5a.75.75 0 0 1 .75.75v14.5a.75.75 0 0 1-.75.75h-3.5a.75.75 0 0 1-.75-.75z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[var(--text-secondary)]">Bambu Labs workflow</p>
                                                    <p className="text-lg font-semibold text-[var(--text-primary)]">A1 / X1 series maker readiness</p>
                                                </div>
                                            </div>

                                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                                {trainingSteps.map((step) => (
                                                    <div
                                                        key={step.title}
                                                        className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                                                    >
                                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</p>
                                                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{step.detail}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                                                <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 font-semibold text-[var(--primary)]">
                                                    Includes safety check
                                                </span>
                                                <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 font-semibold text-[var(--accent)]">
                                                    80% quiz to pass
                                                </span>
                                                <span className="rounded-full bg-[var(--surface)] px-3 py-1 font-semibold text-[var(--text-secondary)] shadow-sm">
                                                    Certificate unlocks reservations
                                                </span>
                                            </div>

                                            <div className="mt-8 flex flex-wrap gap-3">
                                                <button
                                                    onClick={handleCompleteTraining}
                                                    disabled={loadingCert}
                                                    className={`rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[var(--primary-hover)] ${loadingCert ? "opacity-70" : ""}`}
                                                >
                                                    {loadingCert ? "Saving..." : "Mark training complete & unlock certificate"}
                                                </button>
                                                <button
                                                    className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-sm hover:border-[var(--primary)]"
                                                    onClick={handleCompleteTraining}
                                                    disabled={loadingCert}
                                                >
                                                    {loadingCert ? "Saving..." : "I finished the quiz"}
                                                </button>
                                            </div>
                                        </div>

                                        <div
                                            className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
                                            style={{ boxShadow: "var(--shadow-soft)" }}
                                        >
                                            <div
                                                className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-[var(--primary)]/10 blur-3xl"
                                                aria-hidden
                                            />
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-[var(--text-secondary)]">Certificate Preview</p>
                                                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                                                        3D Printer Training Completion
                                                    </h3>
                                                </div>
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        certificateUnlocked
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-[var(--surface)] text-[var(--text-secondary)]"
                                                    }`}
                                                >
                                                    {certificateUnlocked ? "Completed" : loadingCert ? "Checking..." : "Locked"}
                                                </span>
                                            </div>

                                            <div className="mt-5 space-y-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold text-[var(--text-primary)]">Participant</p>
                                                        <p className="text-sm text-[var(--text-secondary)]">MakerSpace Member</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-[var(--text-primary)]">Equipment</p>
                                                        <p className="text-sm text-[var(--text-secondary)]">
                                                            {activeEquipment || "Select equipment"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 rounded-xl bg-[var(--surface)] px-4 py-3 shadow-inner">
                                                    <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-semibold">
                                                        {certificate?.score ?? 80}%
                                                    </div>
                                                    <p className="text-sm text-[var(--text-secondary)]">
                                                        {certificateUnlocked
                                                            ? `Completed on ${certificate?.completed_at ? new Date(certificate.completed_at).toLocaleString() : "—"}`
                                                            : "Pass score met. Certificate will be issued once you confirm training completion."}
                                                    </p>
                                                </div>
                                                    <div className="grid grid-cols-2 gap-3 text-sm text-[var(--text-secondary)]">
                                                        <div className="rounded-lg bg-[var(--surface)] px-3 py-2 shadow-inner">
                                                            <p className="font-semibold text-[var(--text-primary)]">Valid For</p>
                                                        <p>
                                                            {certificate?.expires_at
                                                                ? new Date(certificate.expires_at).toLocaleDateString()
                                                                : "12 months"}
                                                        </p>
                                                        </div>
                                                        <div className="rounded-lg bg-[var(--surface)] px-3 py-2 shadow-inner">
                                                            <p className="font-semibold text-[var(--text-primary)]">Issued By</p>
                                                        <p>{certificate?.issued_by ?? "MakerSpace Team"}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                            <div className="mt-5 flex items-center justify-between gap-3 text-sm">
                                                <p className="text-[var(--text-secondary)]">
                                                    The certificate becomes available as soon as you complete the steps above.
                                                </p>
                                                <button
                                                    className={`rounded-lg px-4 py-2 font-semibold shadow ${
                                                        certificateUnlocked
                                                            ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                                                            : "cursor-not-allowed border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"
                                                    }`}
                                                    disabled={!certificateUnlocked}
                                                    onClick={() => certificateUnlocked && setShowCertModal(true)}
                                                >
                                                    Generate Certificate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeEquipment === "Laser Cutter" ? (
                                <div className="space-y-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
                                                Laser Cutter
                                            </p>
                                            <h2
                                                className="font-heading text-2xl font-bold"
                                                style={{ color: "var(--text-primary)" }}
                                            >
                                                Earn Your Laser Cutter Training Certificate
                                            </h2>
                                            <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
                                                Review laser safety, focusing, ventilation, and approved materials before running a job.
                                                Confirm completion to generate your certificate and unlock laser reservations.
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] shadow-sm">
                                            Approx. 20 minutes
                                        </span>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
                                        <div
                                            className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
                                            style={{ boxShadow: "var(--shadow-soft)" }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                                                        <path d="M12 3a9 9 0 1 0 9 9 9.01 9.01 0 0 0-9-9Zm0 16.5a7.5 7.5 0 1 1 7.5-7.5 7.51 7.51 0 0 1-7.5 7.5Z" />
                                                        <path d="M12 6.75a.75.75 0 0 0-.75.75v2.75H8.5a.75.75 0 0 0 0 1.5h2.75V14.5a.75.75 0 0 0 1.5 0v-2.75h2.75a.75.75 0 0 0 0-1.5h-2.75V7.5A.75.75 0 0 0 12 6.75Z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[var(--text-secondary)]">Laser workflow</p>
                                                    <p className="text-lg font-semibold text-[var(--text-primary)]">Safety, focus, ventilation</p>
                                                </div>
                                            </div>

                                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                                {[
                                                    {
                                                        title: "Safety & Materials",
                                                        detail: "Eye protection, approved materials list, and flame watch best practices.",
                                                    },
                                                    {
                                                        title: "Focus & Power",
                                                        detail: "Bed focus, power/speed presets, and small test burns before production.",
                                                    },
                                                    {
                                                        title: "Ventilation",
                                                        detail: "Start exhaust first, check filters, and keep lid closed during cuts.",
                                                    },
                                                    {
                                                        title: "Job Readiness",
                                                        detail: "Upload file, verify size and placement, and confirm supervised run.",
                                                    },
                                                ].map((step) => (
                                                    <div
                                                        key={step.title}
                                                        className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                                                    >
                                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</p>
                                                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{step.detail}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                                                <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 font-semibold text-[var(--primary)]">
                                                    Includes safety check
                                                </span>
                                                <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 font-semibold text-[var(--accent)]">
                                                    80% quiz to pass
                                                </span>
                                                <span className="rounded-full bg-[var(--surface)] px-3 py-1 font-semibold text-[var(--text-secondary)] shadow-sm">
                                                    Certificate unlocks reservations
                                                </span>
                                            </div>

                                            <div className="mt-8 flex flex-wrap gap-3">
                                                <button
                                                    onClick={handleCompleteTraining}
                                                    disabled={loadingCert}
                                                    className={`rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[var(--primary-hover)] ${loadingCert ? "opacity-70" : ""}`}
                                                >
                                                    {loadingCert ? "Saving..." : "Mark training complete & unlock certificate"}
                                                </button>
                                                <button
                                                    className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-sm hover:border-[var(--primary)]"
                                                    onClick={handleCompleteTraining}
                                                    disabled={loadingCert}
                                                >
                                                    {loadingCert ? "Saving..." : "I finished the quiz"}
                                                </button>
                                            </div>
                                        </div>

                                        <div
                                            className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
                                            style={{ boxShadow: "var(--shadow-soft)" }}
                                        >
                                            <div
                                                className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-[var(--primary)]/10 blur-3xl"
                                                aria-hidden
                                            />
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-[var(--text-secondary)]">Certificate Preview</p>
                                                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                                                        Laser Cutter Training Completion
                                                    </h3>
                                                </div>
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        certificateUnlocked
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-[var(--surface)] text-[var(--text-secondary)]"
                                                    }`}
                                                >
                                                    {certificateUnlocked ? "Completed" : loadingCert ? "Checking..." : "Locked"}
                                                </span>
                                            </div>

                                            <div className="mt-5 space-y-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold text-[var(--text-primary)]">Participant</p>
                                                        <p className="text-sm text-[var(--text-secondary)]">MakerSpace Member</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-[var(--text-primary)]">Equipment</p>
                                                        <p className="text-sm text-[var(--text-secondary)]">
                                                            {activeEquipment || "Select equipment"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 rounded-xl bg-[var(--surface)] px-4 py-3 shadow-inner">
                                                    <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-semibold">
                                                        {certificate?.score ?? 80}%
                                                    </div>
                                                    <p className="text-sm text-[var(--text-secondary)]">
                                                        {certificateUnlocked
                                                            ? `Completed on ${certificate?.completed_at ? new Date(certificate.completed_at).toLocaleString() : "—"}`
                                                            : "Pass score met. Certificate will be issued once you confirm training completion."}
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 text-sm text-[var(--text-secondary)]">
                                                    <div className="rounded-lg bg-[var(--surface)] px-3 py-2 shadow-inner">
                                                        <p className="font-semibold text-[var(--text-primary)]">Valid For</p>
                                                        <p>
                                                            {certificate?.expires_at
                                                                ? new Date(certificate.expires_at).toLocaleDateString()
                                                                : "12 months"}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg bg-[var(--surface)] px-3 py-2 shadow-inner">
                                                        <p className="font-semibold text-[var(--text-primary)]">Issued By</p>
                                                        <p>{certificate?.issued_by ?? "MakerSpace Team"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-5 flex items-center justify-between gap-3 text-sm">
                                                <p className="text-[var(--text-secondary)]">
                                                    The certificate becomes available as soon as you complete the steps above.
                                                </p>
                                                <button
                                                    className={`rounded-lg px-4 py-2 font-semibold shadow ${
                                                        certificateUnlocked
                                                            ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                                                            : "cursor-not-allowed border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"
                                                    }`}
                                                    disabled={!certificateUnlocked}
                                                    onClick={() => certificateUnlocked && setShowCertModal(true)}
                                                >
                                                    Generate Certificate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : activeEquipment === "Soldering Board" ? (
                                <div className="space-y-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--primary)]">
                                                Soldering Board
                                            </p>
                                            <h2
                                                className="font-heading text-2xl font-bold"
                                                style={{ color: "var(--text-primary)" }}
                                            >
                                                Earn Your Soldering Training Certificate
                                            </h2>
                                            <p className="text-[15px] leading-relaxed text-[var(--text-secondary)]">
                                                Cover iron safety, tip care, ESD awareness, and board preparation to unlock soldering station access.
                                                Confirm completion to generate your certificate.
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] shadow-sm">
                                            Approx. 15 minutes
                                        </span>
                                    </div>

                                    <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
                                        <div
                                            className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
                                            style={{ boxShadow: "var(--shadow-soft)" }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                                                        <path d="M12 2.25a.75.75 0 0 0-.75.75v6.69l-2.47 2.47a2.75 2.75 0 1 0 3.89 3.89l3.39-3.39a3.25 3.25 0 0 0-4.6-4.6l-.66.66V3a.75.75 0 0 0-.75-.75Z" />
                                                        <path d="M7.5 4.75a.75.75 0 0 0-1.5 0v1.5a.75.75 0 0 0 1.5 0Z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-[var(--text-secondary)]">Soldering workflow</p>
                                                    <p className="text-lg font-semibold text-[var(--text-primary)]">Safety, tips, ESD care</p>
                                                </div>
                                            </div>

                                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                                {[
                                                    { title: "Iron Safety", detail: "Stand use, heat awareness, and proper shutdown." },
                                                    { title: "Tip Care", detail: "Tin the tip, clean between joints, and avoid dry burns." },
                                                    { title: "ESD & Workspace", detail: "Use mats/straps, tidy wiring, and avoid loose hardware." },
                                                    { title: "Board Prep", detail: "Pre-tin pads, align components, inspect joints, and test continuity." },
                                                ].map((step) => (
                                                    <div
                                                        key={step.title}
                                                        className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-4"
                                                    >
                                                        <p className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</p>
                                                        <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{step.detail}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
                                                <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 font-semibold text-[var(--primary)]">
                                                    Includes safety check
                                                </span>
                                                <span className="rounded-full bg-[var(--accent)]/10 px-3 py-1 font-semibold text-[var(--accent)]">
                                                    80% quiz to pass
                                                </span>
                                                <span className="rounded-full bg-[var(--surface)] px-3 py-1 font-semibold text-[var(--text-secondary)] shadow-sm">
                                                    Certificate unlocks reservations
                                                </span>
                                            </div>

                                            <div className="mt-8 flex flex-wrap gap-3">
                                                <button
                                                    onClick={handleCompleteTraining}
                                                    disabled={loadingCert}
                                                    className={`rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[var(--primary-hover)] ${loadingCert ? "opacity-70" : ""}`}
                                                >
                                                    {loadingCert ? "Saving..." : "Mark training complete & unlock certificate"}
                                                </button>
                                                <button
                                                    className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-sm hover:border-[var(--primary)]"
                                                    onClick={handleCompleteTraining}
                                                    disabled={loadingCert}
                                                >
                                                    {loadingCert ? "Saving..." : "I finished the quiz"}
                                                </button>
                                            </div>
                                        </div>

                                        <div
                                            className="relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
                                            style={{ boxShadow: "var(--shadow-soft)" }}
                                        >
                                            <div
                                                className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-[var(--primary)]/10 blur-3xl"
                                                aria-hidden
                                            />
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold text-[var(--text-secondary)]">Certificate Preview</p>
                                                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                                                        Soldering Training Completion
                                                    </h3>
                                                </div>
                                                <span
                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                        certificateUnlocked
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-[var(--surface)] text-[var(--text-secondary)]"
                                                    }`}
                                                >
                                                    {certificateUnlocked ? "Completed" : loadingCert ? "Checking..." : "Locked"}
                                                </span>
                                            </div>

                                            <div className="mt-5 space-y-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background)] p-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm font-semibold text-[var(--text-primary)]">Participant</p>
                                                        <p className="text-sm text-[var(--text-secondary)]">MakerSpace Member</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-[var(--text-primary)]">Equipment</p>
                                                        <p className="text-sm text-[var(--text-secondary)]">
                                                            {activeEquipment || "Select equipment"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 rounded-xl bg-[var(--surface)] px-4 py-3 shadow-inner">
                                                    <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-semibold">
                                                        {certificate?.score ?? 80}%
                                                    </div>
                                                    <p className="text-sm text-[var(--text-secondary)]">
                                                        {certificateUnlocked
                                                            ? `Completed on ${certificate?.completed_at ? new Date(certificate.completed_at).toLocaleString() : "—"}`
                                                            : "Pass score met. Certificate will be issued once you confirm training completion."}
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 text-sm text-[var(--text-secondary)]">
                                                    <div className="rounded-lg bg-[var(--surface)] px-3 py-2 shadow-inner">
                                                        <p className="font-semibold text-[var(--text-primary)]">Valid For</p>
                                                        <p>
                                                            {certificate?.expires_at
                                                                ? new Date(certificate.expires_at).toLocaleDateString()
                                                                : "12 months"}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-lg bg-[var(--surface)] px-3 py-2 shadow-inner">
                                                        <p className="font-semibold text-[var(--text-primary)]">Issued By</p>
                                                        <p>{certificate?.issued_by ?? "MakerSpace Team"}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-5 flex items-center justify-between gap-3 text-sm">
                                                <p className="text-[var(--text-secondary)]">
                                                    The certificate becomes available as soon as you complete the steps above.
                                                </p>
                                                <button
                                                    className={`rounded-lg px-4 py-2 font-semibold shadow ${
                                                        certificateUnlocked
                                                            ? "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]"
                                                            : "cursor-not-allowed border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]"
                                                    }`}
                                                    disabled={!certificateUnlocked}
                                                    onClick={() => certificateUnlocked && setShowCertModal(true)}
                                                >
                                                    Generate Certificate
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                        {activeEquipment} training
                                    </p>
                                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                        Training content for this equipment is coming soon. Please check back later or contact the MakerSpace
                                        team if you need early access.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}


                </section>
            </main>
            <SiteFooter />

            {showCertModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                    <div className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-white p-6 shadow-2xl">
                        <button
                            onClick={() => setShowCertModal(false)}
                            className="absolute right-3 top-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        >
                            ✕
                        </button>
                        <div className="space-y-4">
                            <div className="text-center">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                                    Certificate Generated
                                </p>
                                <h3 className="mt-1 font-heading text-2xl font-bold text-[var(--text-primary)]">
                                    {activeEquipment} Training
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    Save or screenshot for your records.
                                </p>
                            </div>
                            <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-[var(--text-primary)]">Participant</span>
                                    <span className="text-[var(--text-secondary)]">{userEmail ?? "You"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-[var(--text-primary)]">Machine</span>
                                    <span className="text-[var(--text-secondary)]">{activeEquipment}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-[var(--text-primary)]">Completed</span>
                                    <span className="text-[var(--text-secondary)]">
                                        {certificate?.completed_at
                                            ? new Date(certificate.completed_at).toLocaleString()
                                            : "Just now"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-[var(--text-primary)]">Expires</span>
                                    <span className="text-[var(--text-secondary)]">
                                        {certificate?.expires_at
                                            ? new Date(certificate.expires_at).toLocaleDateString()
                                            : "In 12 months"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold text-[var(--text-primary)]">Issued By</span>
                                    <span className="text-[var(--text-secondary)]">
                                        {certificate?.issued_by ?? `${issuedBy ?? "MakerSpace Team"} (Training)`}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowCertModal(false)}
                                    className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[var(--primary-hover)]"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>

    );
}

export default Training;
