"use client";

import { FeatureCard } from "@/components/feature-card";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

const heroSlides = [
  {
    id: "welcome",
    title: "Create Your Makerspace Account",
    description:
      "Sign up to unlock equipment training, track reservations, and access project resources tailored to your goals.",
    buttons: [
      {
        label: "Create an Account",
        href: "/auth",
        variant: "primary" as const,
      },
      {
        label: "Log-in",
        href: "/auth",
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
        href: "/reserve",
        variant: "primary" as const,
      },
      {
        label: "Equipment Status",
        href: "/equipment-status",
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
        href: "/about",
        variant: "primary" as const,
      },
    ],
  },
];

const features = [
  {
    title: "Step 1: Scan the RFID Tag",
    description:
      "Use your phone to scan the RFID Tag on any equipment or machine.",
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10"
        aria-hidden="true"
      >
        <rect x="14" y="4" width="20" height="40" rx="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="24" cy="38" r="2" fill="currentColor" />
        <path d="M18 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Step 2: Schedule your session",
    description:
      "Enter the date, starting time, and how long you will need. We'll confirm the equipment is free and that your training is up to date.",
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10"
        aria-hidden="true"
      >
        <rect x="8" y="10" width="32" height="30" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 20h32M16 6v8M32 6v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <rect x="14" y="26" width="4" height="4" fill="currentColor" />
        <rect x="22" y="26" width="4" height="4" fill="currentColor" />
        <rect x="30" y="26" width="4" height="4" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Step 3: Start using the Machine",
    description: "Once confirmed, you are authorized to start your session with the machines or collect your checked out gear.",
    icon: (
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-10 w-10"
        aria-hidden="true"
      >
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" />
        <path d="m14 24 7 7 13-13" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function Home() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Filter slides based on authentication status
  const filteredSlides = isSignedIn 
    ? heroSlides.filter(slide => slide.id !== "welcome")
    : heroSlides;

  useEffect(() => {
    // Check initial auth state
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsSignedIn(!!user);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsSignedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  useEffect(() => {
    if (filteredSlides.length === 0) return;
    
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % filteredSlides.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [filteredSlides.length]);

  const handleDotClick = (index: number) => {
    setActiveSlide(index);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--text-primary)",
        }}
      >
        <Navbar />
        <main className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
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
      <main className="mx-auto flex w-full max-w-5xl flex-col items-center gap-16 px-4 py-20 text-center sm:px-5 md:px-8 md:items-stretch md:text-left overflow-x-hidden">
        <section
          className="w-full overflow-hidden rounded-3xl border shadow-sm bg-[var(--surface)] text-[var(--text-primary)]"
          style={{
            borderColor: "var(--border)",
            borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div className="px-4 pt-12 text-center sm:px-6 md:px-10 md:text-left">
            <div className="mx-auto w-full max-w-2xl space-y-6 sm:max-w-3xl">
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
          <div className="relative w-full overflow-hidden px-0 py-12 sm:px-5 md:px-10 bg-[var(--surface)] text-[var(--text-primary)]">
            <div
              className="flex w-full transition-transform duration-700 ease-in-out"
              style={{
                transform: `translateX(-${activeSlide * 100}%)`,
              }}
            >
              {filteredSlides.map((slide) => (
                <div
                  key={slide.id}
                  className="flex basis-full shrink-0 flex-col items-center gap-8 px-1 text-center sm:px-2 md:px-10 md:text-left"
                >
                  <div className="mx-auto w-full max-w-2xl space-y-4 sm:max-w-3xl md:mx-0">
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
              {filteredSlides.map((slide, index) => (
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
          {features.map(({ title, description, icon, href }) => (
            <FeatureCard
              key={title}
              icon={icon}
              title={title}
              description={description}
              href={href}
            />
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Home;
