import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { withPermissionCheck } from "@/utils/server-permissions";

type RouteContext = {
  params: Promise<{ userId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { authorized } = await withPermissionCheck("admin");

  if (!authorized) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user: currentUser },
    error: currentUserError,
  } = await supabase.auth.getUser();

  if (currentUserError || !currentUser) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const { userId } = await context.params;

  if (!userId) {
    return NextResponse.json(
      { error: "User ID is required." },
      { status: 400 },
    );
  }

  if (userId === currentUser.id) {
    return NextResponse.json(
      { error: "You cannot remove your own admin account." },
      { status: 400 },
    );
  }

  let adminSupabase;

  try {
    adminSupabase = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Supabase admin client is not configured.",
      },
      { status: 500 },
    );
  }

  const { error: authDeleteError } = await adminSupabase.auth.admin.deleteUser(
    userId,
  );

  if (authDeleteError) {
    return NextResponse.json(
      { error: `Failed to remove auth user: ${authDeleteError.message}` },
      { status: 500 },
    );
  }

  const cleanupErrors: string[] = [];

  const { error: reservationDeleteError } = await adminSupabase
    .from("reservations")
    .delete()
    .eq("user_id", userId);

  if (reservationDeleteError) {
    cleanupErrors.push(`reservations: ${reservationDeleteError.message}`);
  }

  const { error: certificateDeleteError } = await adminSupabase
    .from("training_certificates")
    .delete()
    .eq("user_id", userId);

  if (certificateDeleteError) {
    cleanupErrors.push(
      `training_certificates: ${certificateDeleteError.message}`,
    );
  }

  const { error: profileDeleteError } = await adminSupabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileDeleteError) {
    cleanupErrors.push(`profiles: ${profileDeleteError.message}`);
  }

  if (cleanupErrors.length > 0) {
    return NextResponse.json(
      {
        error:
          "The auth account was removed, but some related records could not be cleaned up.",
        details: cleanupErrors,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
