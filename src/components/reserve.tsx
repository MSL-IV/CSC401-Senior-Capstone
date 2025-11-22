"use client";

import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import ReserveForm from "@/components/reserve-form";

type Equipment = {
  id: string;
  name: string;
  slotMinutes: number;
};

export function Reserve({ equipment }: { equipment: Equipment[] }) {
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
                Reserve Equipment
              </h1>
              <p
                className="text-lg leading-relaxed md:text-xl"
                style={{ color: "var(--text-secondary)" }}
              >
                Choose a date, pick a machine, and select an available time
                slot.
              </p>
            </div>
            {/* accent divider, matches Home */}
            <div
              className="mt-8 h-1 w-full rounded-full"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, var(--primary) 0%, var(--accent) 60%, var(--primary-hover) 100%)",
              }}
            />
          </div>

          <div className="px-6 py-12 md:px-20">
            <div className="mx-auto max-w-4xl">
              <ReserveForm equipment={equipment} />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default Reserve;
