// use http://localhost:3000/training to see
// Add the video and exams later

"use client";

import { Navbar } from "@/components/navbar";
import  {SiteFooter} from "@/components/site-footer";
import { useState} from "react";

export function Training() {

    const equipment = [
        { id: "3dp", name: "3D Printer" },
        { id: "laser", name: "Laser Cutter" },
        { id: "solder", name: "Soldering Board" },
    ];

    const [selectedEquipment, setSelectedEquipment] = useState("");
    const [activeEquipment, setActiveEquipment] = useState("");
    const [certificateUnlocked, setCertificateUnlocked] = useState(false);

    const handleSearch = () => {
        if (!selectedEquipment) {
            alert("Please select equipment.");
            return;
        }
        setActiveEquipment(selectedEquipment);
        setCertificateUnlocked(false);
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
                        >
                            <option value="">-- Choose Equipment --</option>
                            {equipment.map((eq) => (
                                <option key={eq.id} value={eq.name}>
                                    {eq.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleSearch}
                            className="mt-4 w-full rounded-lg bg-[var(--primary)] px-4 py-2 text-white shadow hover:bg-[var(--primary-hover)]"
                        >
                            Go
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
                                                    onClick={() => setCertificateUnlocked(true)}
                                                    className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white shadow hover:bg-[var(--primary-hover)]"
                                                >
                                                    Mark training complete & unlock certificate
                                                </button>
                                                <button
                                                    className="rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-sm hover:border-[var(--primary)]"
                                                    onClick={() => setCertificateUnlocked(true)}
                                                >
                                                    I finished the quiz
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
                                                    {certificateUnlocked ? "Ready to issue" : "Locked"}
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
                                                        <p className="text-sm text-[var(--text-secondary)]">Bambu Labs 3D Printer</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 rounded-xl bg-[var(--surface)] px-4 py-3 shadow-inner">
                                                    <div className="h-10 w-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-semibold">
                                                        80%
                                                    </div>
                                                    <p className="text-sm text-[var(--text-secondary)]">
                                                        Pass score met. Certificate will be issued once you confirm training completion.
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 text-sm text-[var(--text-secondary)]">
                                                    <div className="rounded-lg bg-[var(--surface)] px-3 py-2 shadow-inner">
                                                        <p className="font-semibold text-[var(--text-primary)]">Valid For</p>
                                                        <p>12 months</p>
                                                    </div>
                                                    <div className="rounded-lg bg-[var(--surface)] px-3 py-2 shadow-inner">
                                                        <p className="font-semibold text-[var(--text-primary)]">Issued By</p>
                                                        <p>MakerSpace Team</p>
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
        </div>

    );
}

export default Training;
