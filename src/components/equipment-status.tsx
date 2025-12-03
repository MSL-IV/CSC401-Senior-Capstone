"use client";

import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";

const equipmentStatuses = [
  {
    id: "3d-printer",
    name: "3D Printer",
    status: "Available",
    statusDetail: "Next reservation starts at 3:30 PM",
    description: "Ultimaker S5 dual extrusion printer with PLA loaded",
  },
  {
    id: "laser",
    name: "Laser Cutter",
    status: "In Use",
    statusDetail: "Estimated completion in 25 minutes",
    description: "Epilog Fusion Pro 32, 40W CO₂ laser",
  },
  {
    id: "cnc",
    name: "CNC Router",
    status: "Maintenance",
    statusDetail: "Technicians expect the machine back online tomorrow",
    description: "ShopBot PRSalpha 96x48 router",
  },
];

export function EquipmentStatus() {
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

        <section className="grid gap-6 md:grid-cols-2">
          {equipmentStatuses.map((equipment) => (
            <article
              key={equipment.id}
              className="flex flex-col gap-3 border p-5"
              style={{
                backgroundColor: "var(--surface)",
                borderColor: "var(--border)",
                borderRadius: "var(--radius-card)",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  {equipment.name}
                </h2>
                <span
                  className="rounded-full px-3 py-1 text-sm font-semibold"
                  style={{
                    backgroundColor: "var(--primary)",
                    color: "var(--on-primary)",
                  }}
                >
                  {equipment.status}
                </span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {equipment.description}
              </p>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {equipment.statusDetail}
              </p>
            </article>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export default EquipmentStatus;
