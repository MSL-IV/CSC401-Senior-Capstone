"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";

export function FacultySignInOut() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // ---------- Fetch the shared global status ----------
  const fetchGlobalStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("makerspace_global_status")
        .select("is_open")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Error fetching global status:", error);
        return;
      }

      setIsOpen(data?.is_open ?? false);
    } catch (err) {
      console.error("Error fetching global status:", err);
    }
  };

  // ---------- Fetch authenticated user & role ----------
  const fetchUserData = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Please sign in to access faculty controls");
        setLoading(false);
        return;
      }

      setUser(user);

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

      // Load global status
      await fetchGlobalStatus();

      setLoading(false);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load user data");
      setLoading(false);
    }
  };

  // ---------- Toggle the shared global status ----------
  const toggleMakerspaceStatus = async () => {
    if (!user || actionLoading) return;

    setActionLoading(true);
    setError(null);

    try {
      const newStatus = !isOpen;

      const { error } = await supabase
        .from("makerspace_global_status")
        .update({
          is_open: newStatus,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);

      if (error) throw error;

      setIsOpen(newStatus);
    } catch (err: any) {
      console.error("Error toggling makerspace status:", err);
      setError(err.message || "Failed to toggle makerspace status");
    } finally {
      setActionLoading(false);
    }
  };

  // ---------- Lifecycle: fetch data + real-time subscription ----------
  useEffect(() => {
    fetchUserData();

    // Real-time: re-fetch global status whenever the row changes
    const channel = supabase
      .channel("global-status-toggle")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "makerspace_global_status",
        },
        () => {
          fetchGlobalStatus();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase]);

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

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
        <div className={`h-3 w-3 rounded-full ${isOpen ? 'bg-green-400' : 'bg-red-400'}`} />
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Makerspace Status
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">
            {isOpen ? 'Currently Open' : 'Currently Closed'}
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
          ${isOpen ? 'bg-green-500' : 'bg-gray-300'}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-lg transition-transform duration-200 ease-in-out
            ${isOpen ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
    </div>
  );
}