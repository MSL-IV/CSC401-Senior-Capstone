"use client";

import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
<<<<<<< Updated upstream
=======
import { createClient } from "@/utils/supabase/client";
import { formatInEastern } from "@/utils/time";
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
=======
  const [equipmentStatuses, setEquipmentStatuses] = useState<EquipmentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMachinesAndReservations() {
      try {
        setLoading(true);
        
        // Fetch machines
        const { data: machines, error: machinesError } = await supabase
          .from('machines')
          .select('*')
          .order('name');

        if (machinesError) {
          setError('Failed to fetch machines: ' + machinesError.message);
          return;
        }

        // Fetch active reservations
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

        // Transform data to equipment status format
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

          // Check if machine is currently in use
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

          // Check for next reservation
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
    
    // Refresh every 30 seconds for real-time updates
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

>>>>>>> Stashed changes
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
