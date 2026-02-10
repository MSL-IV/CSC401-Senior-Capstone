"use client";

import React from "react";
import { Navbar } from "@/components/navbar";
import  {SiteFooter} from "@/components/site-footer";
import { FeatureCard } from "@/components/feature-card";

interface FAQItem {
    question: string;
    answer: string;
}

const features = [
    {
        title: "DESIGN AND PROTOTYPING",
        description:
            "Desktop computers, breadboards, soldering stations, digital multi-meters, DC power supplies, oscilloscope, USB microscope",
        icon: (
            <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
                aria-hidden="true"
            >
                <path
                    d="M8 14h32v20H8z"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
                <path
                    d="M16 14V8h16v6M16 34v6h16v-6"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
                <path
                    d="M20 20h8v8h-8z"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
            </svg>
        ),
    },
    {
        title: "FABRICATION",
        description:
            "Glowforge Pro lasers, 3D printers, desktop CNC milling machine, drill press, vacuum former, vinyl cutter, heat press, large format printer",
        icon: (
            <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
                aria-hidden="true"
            >
                <path
                    d="m26 12 10 10-6 6-10-10"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
                <path
                    d="M18 34H8v-6l14-14M32 28h8"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
                <path
                    d="M24 18a4 4 0 1 1 5.66-5.66A4 4 0 0 1 24 18Z"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
            </svg>
        ),
    },
    {
        title: "ASSEMBLY",
        description:
            "Cordless drills, screwdrivers, pliers, hammers and mallets, wrenches and sockets, bits, wire cutters and strippers, tweezers, measuring tapes, cutters and scissors",
        icon: (
            <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
                aria-hidden="true"
            >
                <path
                    d="m26 12 10 10-6 6-10-10"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
                <path
                    d="M18 34H8v-6l14-14M32 28h8"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
                <path
                    d="M24 18a4 4 0 1 1 5.66-5.66A4 4 0 0 1 24 18Z"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
            </svg>
        ),
    },
    {
        title: "PRODUCTION",
        description: "Portable photo studio",
        icon: (
            <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10"
                aria-hidden="true"
            >
                <path
                    d="M24 8a9 9 0 0 0-4.85 16.6c.24.16.38.44.34.73l-.72 5.75a1 1 0 0 0 1.57.97l3.66-2.44a.9.9 0 0 1 .98 0l3.66 2.44a1 1 0 0 0 1.57-.97l-.72-5.75a.9.9 0 0 1 .34-.73A9 9 0 0 0 24 8Z"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinejoin="round"
                />
                <path
                    d="M18 40h12"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                />
            </svg>
        ),
    },
];

const faqs: FAQItem[] = [
    {
        question : "q1",
        answer : "a1",
    },
    {
        question : "q2",
        answer : "a2",
    },
    {
        question : "q3",
        answer : "a3",
    },
];

function About() {
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

                {/* 1️⃣ ABOUT + GENERAL INFO */}
                <section
                    className="overflow-hidden rounded-3xl border shadow-sm bg-[var(--surface)] text-[var(--text-primary)]"
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
                                About the UT Makerspace
                            </h1>
                            <p
                                className="text-lg leading-relaxed md:text-xl"
                                style={{ color: "var(--text-secondary)" }}
                            >
                                The computer science makerspace, located on the sixth floor of the Jenkins Technology Building,
                                is a 500 square foot facility fully equipped with the leading-edge technology, software, and
                                hardware that supports student projects throughout the computer science curriculum.
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

                    {/* General Info inside same box */}
                    <div className="px-6 py-12 md:px-20">
                        <div className="mx-auto max-w-4xl space-y-8">
                            <h2 className="text-2xl font-semibold">General Information</h2>
                            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                                {/* Column 1 */}
                                <div className="space-y-4">
                                    <h3
                                        className="border-b pb-2 text-xl font-medium"
                                        style={{ borderColor: "var(--border)" }}
                                    >
                                        Location & Hours
                                    </h3>
                                    <p style={{ color: "var(--text-secondary)" }}>
                                        <span className="font-semibold text-primary">Location:</span>
                                        <br />
                                        The Computer Science Makerspace is located on the
                                        <strong> sixth floor of the Jenkins Technology Building</strong>, at{" "}
                                        <strong>350 UT University Dr, Tampa, FL 33606</strong>.
                                    </p>
                                    <p style={{ color: "var(--text-secondary)" }}>
                                        <span className="font-semibold text-primary">Hours of Operation:</span>
                                        <br />
                                        Mon – Fri: [Insert Hours Here]
                                        <br />
                                        Sat – Sun: [Insert Hours Here]
                                    </p>
                                </div>

                                {/* Column 2 */}
                                <div className="space-y-4">
                                    <h3
                                        className="border-b pb-2 text-xl font-medium"
                                        style={{ borderColor: "var(--border)" }}
                                    >
                                        Access & Support
                                    </h3>
                                    <p style={{ color: "var(--text-secondary)" }}>
                                        <span className="font-semibold text-primary">Eligibility:</span>
                                        <br />
                                        <strong>UTampa students, faculty, and staff</strong>.
                                    </p>
                                    <p style={{ color: "var(--text-secondary)" }}>
                                        <span className="font-semibold text-primary">Access Requirements:</span>
                                        <br />
                                        Users must create a Makerspace account, complete any required safety training or certifications,
                                        and follow general access rules.
                                    </p>
                                    <p style={{ color: "var(--text-secondary)" }}>
                                        <span className="font-semibold text-primary">Who to Contact:</span>
                                        <br />
                                        <strong>Professor Jean Gourd</strong> (Chair):{" "}
                                        <a href="mailto:jgourd@ut.edu" className="text-blue-600 hover:underline">
                                            jgourd@ut.edu
                                        </a>
                                        , phone: 813-257-6305
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2️⃣ WHAT'S IN THE MAKERSPACE */}
                <section
                    className="overflow-hidden rounded-3xl border shadow-sm bg-[var(--surface)] text-[var(--text-primary)]"
                    style={{
                        borderColor: "var(--border)",
                        borderRadius: "var(--radius-card)",
                        boxShadow: "var(--shadow-soft)",
                    }}
                >
                    <div className="px-6 py-12 md:px-20">
                        <h2
                            className="mb-10 text-center font-heading text-3xl font-bold tracking-tight md:text-4xl"
                            style={{ color: "var(--text-primary)" }}
                        >
                            What’s in the Makerspace
                        </h2>

                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {features.map((feature) => (
                                <FeatureCard
                                    key={feature.title}
                                    icon={feature.icon}
                                    title={feature.title}
                                    description={feature.description}
                                />
                            ))}
                        </div>
                    </div>
                </section>

                {/* 3️⃣ FAQ */}
                <section
                    className="overflow-hidden rounded-3xl border shadow-sm bg-[var(--surface)] text-[var(--text-primary)]"
                    style={{
                        borderColor: "var(--border)",
                        borderRadius: "var(--radius-card)",
                        boxShadow: "var(--shadow-soft)",
                    }}
                >
                    <div className="px-6 py-12 md:px-20">
                        <h2
                            className="mb-10 text-center font-heading text-3xl font-bold tracking-tight md:text-4xl"
                            style={{ color: "var(--text-primary)" }}
                        >
                            Frequently Asked Questions
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-lg">How can I gain access into the Makerspace?</h3>
                                <p className="text-[var(--text-secondary)]">
                                    All UTampa students, faculty, and staff can use their UTampa identification cards to get access into Makerspace during their reservation time.
                                </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">What if I do not know how to use the equipment?</h3>
                                <p className="text-[var(--text-secondary)]">All users must complete training before using any machine to ensure safety and proper operation. </p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-lg">Is there a cost to use the makerspace?</h3>
                                <p className="text-[var(--text-secondary)]">No, access to the makerspace and all its equipment is free for all UTampa students, faculty, and staff.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <SiteFooter />
        </div>
    );
}

export default About;
