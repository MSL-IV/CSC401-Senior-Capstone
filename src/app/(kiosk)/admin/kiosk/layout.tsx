import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

async function requireKioskAccess() {
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

  const role = profile?.role;

  if (profileError || (role !== "admin" && role !== "faculty" && role !== "kiosk")) {
    redirect("/");
  }

  return profile;
}

export default async function KioskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireKioskAccess();

  return (
    <div
      className="min-h-screen bg-[var(--background)] text-[var(--text-primary)]"
      style={{ color: "var(--text-primary)" }}
    >
      {children}
    </div>
  );
}
