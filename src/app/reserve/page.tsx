import Reserve from "@/components/reserve";
import { createClient as createServerClient } from "@/utils/supabase/server";

export const metadata = {
  title: "Reserve Equipment",
};

export default async function ReservePage() {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("machines")
    .select("id, name, slot_minutes, active")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error loading machines:", error?.message, error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Unable to load machines right now.</p>
      </div>
    );
  }

  const equipment =
    data?.map((m) => ({
      id: m.id as string,
      name: m.name as string,
      slotMinutes: m.slot_minutes ?? 30,
    })) ?? [];

  return <Reserve equipment={equipment} />;
}
