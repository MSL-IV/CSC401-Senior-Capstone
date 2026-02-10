"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

interface FacultySession {
  id: string;
  user_email: string;
  sign_in_time: string;
  sign_out_time?: string;
  duration_minutes?: number;
}

export function FacultySignInOut() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<FacultySession | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const supabase = createClient();

  const fetchUserData = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Please sign in to access faculty controls");
        setLoading(false);
        return;
      }

      setUser(user);

      // Get user role from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        setError("Error loading user profile");
        setLoading(false);
        return;
      }

      setUserRole(profile?.role || "student");

      // Check if user has an active session
      if (profile?.role === "faculty" || profile?.role === "admin") {
        await checkActiveSession(user.id);
      }

      setLoading(false);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load user data");
      setLoading(false);
    }
  };

  const checkActiveSession = async (userId: string) => {
    try {
      const { data: activeSession, error } = await supabase
        .from("makerspace_sessions")
        .select("*")
        .eq("user_id", userId)
        .is("sign_out_time", null)
        .order("sign_in_time", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
        console.error("Error checking active session:", error);
        return;
      }

      setCurrentSession(activeSession || null);
    } catch (err) {
      console.error("Error checking active session:", err);
    }
  };

  const toggleMakerspaceStatus = async () => {
    if (!user || actionLoading) return;

    setActionLoading(true);
    setError(null);

    try {
      if (currentSession) {
        // Sign out
        const { error } = await supabase
          .from("makerspace_sessions")
          .update({ sign_out_time: new Date().toISOString() })
          .eq("id", currentSession.id);

        if (error) throw error;
        setCurrentSession(null);
      } else {
        // Sign in
        const { data, error } = await supabase
          .from("makerspace_sessions")
          .insert({
            user_id: user.id,
            user_email: user.email || "",
            user_role: userRole || "faculty"
          })
          .select()
          .single();

        if (error) throw error;
        setCurrentSession(data);
      }
    } catch (err: any) {
      console.error("Error toggling makerspace status:", err);
      setError(err.message || "Failed to toggle makerspace status");
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  // Only show for faculty and admin users
  if (!user || (userRole !== "faculty" && userRole !== "admin")) {
    return (
      <div className="text-center p-6 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
        <p className="text-[var(--text-secondary)]">
          Faculty sign-in controls are only available to faculty and admin users.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg">
      <div className="flex items-center gap-3">
        <div className={`h-3 w-3 rounded-full ${currentSession ? 'bg-green-400' : 'bg-red-400'}`} />
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Makerspace Status
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            {currentSession ? 'Currently Open' : 'Currently Closed'}
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mx-4 text-xs text-red-600">
          {error}
        </div>
      )}

      <button
        onClick={toggleMakerspaceStatus}
        disabled={actionLoading}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50
          ${currentSession ? 'bg-green-500' : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
            ${currentSession ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}