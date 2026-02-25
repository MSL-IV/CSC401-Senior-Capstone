"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type MakerspaceStatus = "open" | "closed" | "loading";

interface StatusLightProps {
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function StatusLight({ 
  size = "md", 
  showLabel = true, 
  className = "" 
}: StatusLightProps) {
  const [status, setStatus] = useState<MakerspaceStatus>("loading");
  const supabase = createClient();

  // Size variants for the light indicator
  const sizeClasses = {
    sm: "h-2 w-2",
    md: "h-3 w-3", 
    lg: "h-4 w-4"
  };

  const checkMakerspaceStatus = async () => {
    try {
      // Read from the single-row global status table
      const { data, error } = await supabase
        .from("makerspace_global_status")
        .select("is_open")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("Error checking global status:", error);
        // Fallback: time-based logic (weekdays 9-5 = open)
        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay();
        const isWeekday = currentDay >= 1 && currentDay <= 5;
        const isOpenHours = currentHour >= 9 && currentHour < 17;
        setStatus(isWeekday && isOpenHours ? "open" : "closed");
        return;
      }

      setStatus(data?.is_open ? "open" : "closed");
    } catch (error) {
      console.error("Error checking makerspace status:", error);
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay();
      const isWeekday = currentDay >= 1 && currentDay <= 5;
      const isOpenHours = currentHour >= 9 && currentHour < 17;
      setStatus(isWeekday && isOpenHours ? "open" : "closed");
    }
  };

  useEffect(() => {
    checkMakerspaceStatus();

    // Real-time subscription to the global status table
    const subscription = supabase
      .channel("makerspace-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "makerspace_global_status"
        },
        () => {
          checkMakerspaceStatus();
        }
      )
      .subscribe();

    // Refresh every 30 seconds as fallback
    const interval = setInterval(checkMakerspaceStatus, 30000);

    return () => {
      subscription.unsubscribe();
      clearInterval(interval);
    };
  }, [supabase]);

  const getStatusColor = () => {
    switch (status) {
      case "open":
        return "bg-green-400 ring-2 ring-green-200 shadow-lg shadow-green-500/30";
      case "closed":
        return "bg-red-400 ring-2 ring-red-200 shadow-lg shadow-red-500/30";
      case "loading":
        return "bg-yellow-400 ring-2 ring-yellow-200 shadow-lg shadow-yellow-500/30";
      default:
        return "bg-gray-400 ring-2 ring-gray-200 shadow-lg shadow-gray-500/30";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "open":
        return "Open";
      case "closed":
        return "Closed";
      case "loading":
        return "...";
      default:
        return "Unknown";
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`
          ${sizeClasses[size]} 
          rounded-full 
          ${getStatusColor()}
          ${status === "loading" ? "animate-spin" : ""}
          border border-white/50
        `}
        title={`Makerspace is ${getStatusText().toLowerCase()}`}
      />
      {showLabel && (
        <span
          className={`text-sm font-semibold drop-shadow-sm ${
            status === "open" 
              ? "text-green-100" 
              : status === "closed" 
              ? "text-red-100" 
              : "text-yellow-100"
          }`}
        >
          {getStatusText()}
        </span>
      )}
    </div>
  );
}