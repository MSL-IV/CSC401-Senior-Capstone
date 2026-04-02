import { NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";

type PrecheckPayload = {
  studentId?: string;
};

export async function POST(request: Request) {
  let payload: PrecheckPayload;

  try {
    payload = (await request.json()) as PrecheckPayload;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const studentId = payload.studentId?.trim();

  if (!studentId) {
    return NextResponse.json({ duplicateStudentId: false });
  }

  let adminSupabase;

  try {
    adminSupabase = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Signup precheck is unavailable." },
      { status: 503 },
    );
  }

  const { data, error } = await adminSupabase
    .from("profiles")
    .select("id")
    .eq("student_id", studentId)
    .limit(1);

  if (error) {
    return NextResponse.json(
      { error: "Unable to validate student ID." },
      { status: 500 },
    );
  }

  if ((data?.length ?? 0) > 0) {
    return NextResponse.json(
      {
        duplicateStudentId: true,
        error:
          "That student ID is already registered. Use a different student ID or contact an admin.",
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ duplicateStudentId: false });
}
