import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

async function requireAdminOrFaculty() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth?redirectTo=/admin/kiosk");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || (profile?.role !== "admin" && profile?.role !== "faculty")) {
    redirect("/");
  }

  return profile;
}

export default async function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminOrFaculty();

  return (
    <div
      className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]"
      style={{ color: "var(--text-primary)" }}
    >
      {children}
    </div>
  );
}
