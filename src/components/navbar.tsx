"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth={1.6} />
    <path
      d="m20 20-3.3-3.3"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-7 w-7"
    aria-hidden="true"
  >
    <circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth={1.6} />
    <path
      d="M6.5 19c1.2-2.3 3.6-3.5 5.5-3.5s4.3 1.2 5.5 3.5"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
    />
  </svg>
);

const navLinks = [
  { name: "Home", href: "/" },
  { name: "Reserve a Time", href: "/reserve" },
  { name: "Equipment Status", href: "#" },
  { name: "About", href: "/about" },
];

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header
      className="border-b shadow-sm"
      style={{
        backgroundColor: "var(--primary)",
        borderColor: "var(--primary)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/95 p-1 shadow-sm">
            <Image
              src="/UTampa_logo.svg"
              alt="University of Tampa Makerspace logo"
              width={36}
              height={36}
              priority
            />
          </span>
          <span
            className="font-heading text-base font-semibold uppercase tracking-wide"
            style={{ color: "var(--on-primary)" }}
          >
            UT MAKERSPACE
          </span>
        </div>
        <div className="ml-auto flex items-center gap-6">
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-sm font-medium transition-opacity hover:opacity-90"
                style={{ color: "rgba(255,255,255,0.88)" }}
              >
                {link.name}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="rounded-full border border-transparent p-2 transition hover:border-white/50"
              aria-label="Search"
              style={{
                color: "rgba(255,255,255,0.88)",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              <SearchIcon />
            </button>
{loading ? (
              <button
                type="button"
                className="rounded-full border border-transparent p-1 transition hover:border-white/50"
                aria-label="Loading"
                style={{
                  color: "rgba(255,255,255,0.88)",
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              >
                <UserIcon />
              </button>
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="hidden text-sm font-medium md:block" style={{ color: "rgba(255,255,255,0.88)" }}>
                  {user.user_metadata?.first_name || user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="rounded-lg border border-white/30 px-3 py-1 text-sm font-medium transition hover:bg-white/10"
                  style={{ color: "rgba(255,255,255,0.88)" }}
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                href="/auth"
                className="rounded-lg border border-white/30 px-3 py-1 text-sm font-medium transition hover:bg-white/10"
                style={{ color: "rgba(255,255,255,0.88)" }}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
