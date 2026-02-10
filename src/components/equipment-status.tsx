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

const supabase = createClient();

export function EquipmentStatus() {
  const [equipmentStatuses, setEquipmentStatuses] = useState<EquipmentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMachinesAndReservations() {
      try {
        setLoading(true);
        
        const { data: machines, error: machinesError } = await supabase
          .from('machines')
          .select('*')
          .order('name');

        if (machinesError) {
          setError('Failed to fetch machines: ' + machinesError.message);
          return;
        }

        const now = new Date();
        const { data: reservations, error: reservationsError } = await supabase
          .from('reservations')
          .select('*')
          .gte('end', now.toISOString())
          .order('start');

        if (reservationsError) {
          setError('Failed to fetch reservations: ' + reservationsError.message);
          return;
        }

        const statuses: EquipmentStatus[] = (machines || []).map((machine: Machine) => {
          if (!machine.active) {
            return {
              id: machine.id,
              name: machine.name,
              status: "Maintenance",
              statusDetail: "Machine is currently offline",
              description: machine.description || "No description available",
            };
          }

          const currentReservation = (reservations || []).find((res: Reservation) => 
            res.machine === machine.name && 
            new Date(res.start) <= now && 
            new Date(res.end) > now
          );

          if (currentReservation) {
            const endTime = new Date(currentReservation.end);
            const minutesLeft = Math.round((endTime.getTime() - now.getTime()) / (1000 * 60));
            return {
              id: machine.id,
              name: machine.name,
              status: "In Use",
              statusDetail: `Estimated completion in ${minutesLeft} minutes`,
              description: machine.description || "No description available",
            };
          }

          const nextReservation = (reservations || []).find((res: Reservation) => 
            res.machine === machine.name && 
            new Date(res.start) > now
          );

          if (nextReservation) {
            const startTime = new Date(nextReservation.start);
            const timeString = formatInEastern(startTime, {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
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
        });

        setEquipmentStatuses(statuses);
      } catch (err) {
        setError('An unexpected error occurred');
        console.error('Equipment status fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMachinesAndReservations();
    
    const interval = setInterval(fetchMachinesAndReservations, 30000);
    return () => clearInterval(interval);
  }, []);

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
                <h3 className="font-heading text-xl font-semibold">{equipment.name}</h3>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    equipment.status === "Available"
                      ? "bg-emerald-50 text-emerald-700"
                      : equipment.status === "In Use"
                      ? "bg-amber-50 text-amber-700"
                      : "bg-rose-50 text-rose-700"
                  }`}
                >
                  {equipment.status}
                </span>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                {equipment.description}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
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
