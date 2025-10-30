"use client";

import { FeatureCard } from "@/components/feature-card";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { useEffect, useState } from "react";

const heroSlides = [
  {
    id: "welcome",
    title: "Create Your Makerspace Account",
    description:
      "Sign up to unlock equipment training, track reservations, and access project resources tailored to your goals.",
    buttons: [
      {
        label: "Create an Account",
        href: "#",
        variant: "primary" as const,
      },
      {
        label: "Log-in",
        href: "#",
        variant: "secondary" as const,
      },
    ],
  },
  {
    id: "reserve",
    title: "Reserve Equipment in Minutes",
    description:
      "Secure time on our 3D printers, laser cutters, and fabrication tools. Check availability and status before you arrive.",
    buttons: [
      {
        label: "Reserve Equipment",
        href: "#",
        variant: "primary" as const,
      },
      {
        label: "Equipment Status",
        href: "#",
        variant: "secondary" as const,
      },
    ],
  },
  {
    id: "about",
    title: "Explore the Makerspace Story",
    description:
      "Learn about our mission, staff, and how we support student innovation across the University of Tampa.",
    buttons: [
      {
        label: "About the Makerspace",
        href: "#",
        variant: "primary" as const,
      },
    ],
  },
];

const features = [
  {
    title: "3D Printing & Fabrication",
    description:
      "Access professional-grade 3D printers, laser cutters, and CNC machines.",
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
    title: "Workshops & Training",
    description:
      "Join sessions on CAD modeling, soldering, and safety certification.",
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
    title: "Student Innovation Projects",
    description: "Collaborate with peers and turn your ideas into prototypes.",
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

export function Home() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % heroSlides.length);
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  const handleDotClick = (index: number) => {
    setActiveSlide(index);
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
      <main
        className="mx-auto flex max-w-6xl flex-col items-center gap-16 px-6 py-20 text-center md:items-stretch md:text-left"
      >
        <section
          className="overflow-hidden rounded-3xl border bg-white shadow-sm"
          style={{
            borderColor: "var(--border)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div className="px-6 pt-12 text-center md:px-20 md:text-left">
            <div className="mx-auto max-w-3xl space-y-6">
              <h1
                className="font-heading text-4xl font-bold tracking-tight md:text-5xl"
                style={{ color: "var(--text-primary)" }}
              >
                Welcome to the UT Makerspace
              </h1>
              <p
                className="text-lg leading-relaxed md:text-xl"
                style={{ color: "var(--text-secondary)" }}
              >
                A creative hub where innovation meets technology. Design,
                prototype, and build using our 3D printers, laser cutters, and
                electronic fabrication tools – all right here on campus.
              </p>
            </div>
            <div
              className="mt-8 h-1 w-full rounded-full"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, var(--primary) 0%, var(--accent) 60%, var(--primary-hover) 100%)",
              }}
            />
          </div>
          <div className="relative w-full overflow-hidden bg-white px-6 py-12 md:px-20">
            <div
              className="flex w-full transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${activeSlide * 100}%)`,
              }}
            >
              {heroSlides.map((slide) => (
                <div
                  key={slide.id}
                  className="flex w-full shrink-0 flex-col items-center gap-8 px-2 text-center md:px-4 md:text-left"
                >
                  <div className="mx-auto max-w-3xl space-y-4 md:mx-0">
                    <h2
                      className="font-heading text-2xl font-semibold tracking-tight md:text-3xl"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {slide.title}
                    </h2>
                    <p
                      className="text-base leading-relaxed md:text-lg"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {slide.description}
                    </p>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row">
                    {slide.buttons.map((button) => (
                      <a
                        key={button.label}
                        href={button.href}
                        className={`rounded-lg px-8 py-3 text-sm font-semibold uppercase tracking-wide transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                          button.variant === "primary"
                            ? "shadow hover:brightness-90"
                            : "border hover:bg-rose-50"
                        }`}
                        style={{
                          backgroundColor:
                            button.variant === "primary"
                              ? "var(--primary)"
                              : "transparent",
                          color:
                            button.variant === "primary"
                              ? "var(--on-primary)"
                              : "var(--secondary)",
                          borderColor:
                            button.variant === "secondary"
                              ? "var(--border)"
                              : "transparent",
                          borderRadius: "var(--radius-button)",
                          boxShadow:
                            button.variant === "primary"
                              ? "var(--shadow-soft)"
                              : undefined,
                        }}
                      >
                        {button.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 flex items-center justify-center gap-3 md:justify-start">
              {heroSlides.map((slide, index) => (
                <button
                  type="button"
                  key={slide.id}
                  className="h-2.5 w-2.5 rounded-full border-0 p-0 transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    backgroundColor:
                      index === activeSlide
                        ? "var(--secondary)"
                        : "var(--border)",
                    outlineColor: "var(--secondary)",
                  }}
                  onClick={() => handleDotClick(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
        <section className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Home;
