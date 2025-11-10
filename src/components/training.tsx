// use http://localhost:3000/training to see

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

    const handleSearch = () => {
        if (!selectedEquipment) {
            alert("Please select equipment.");
            return;
        }
        // Do something when the user clicks search, e.g., redirect to training video or test
        alert(`You selected: ${selectedEquipment}`);
    };

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
                    className="overflow-hidden rounded-3xl border bg-white shadow-sm"
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
                    <div className="mt-10 mx-auto max-w-md">
                        <label
                            htmlFor="equipment"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Select Equipment
                        </label>
                        <select
                            id="equipment"
                            value={selectedEquipment}
                            onChange={(e) => setSelectedEquipment(e.target.value)}
                            className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(200,16,46,0.2)]"
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


                </section>
            </main>
            <SiteFooter />
        </div>

    );
}

export default Training;