"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  { name: "Equipment Status", href: "/equipment-status" },
  { name: "About", href: "/about" },
];

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileRole, setProfileRole] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        setProfileRole(null);
      }
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        if (!nextUser) {
          setProfileRole(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
  };

  const displayName =
    user?.user_metadata?.full_name ||
    [
      user?.user_metadata?.first_name as string | undefined,
      user?.user_metadata?.last_name as string | undefined,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    user?.email ||
    "Account";

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickAway = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("click", handleClickAway);
    return () => window.removeEventListener("click", handleClickAway);
  }, [menuOpen]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [mobileOpen]);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      if (!user) {
        setProfileRole(null);
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!active) return;

      if (error) {
        console.error("Unable to load profile role:", error.message);
        setProfileRole(null);
      } else {
        setProfileRole(data?.role ?? null);
      }
      setProfileLoading(false);
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, [supabase, user]);

  return (
    <header
      className="border-b shadow-sm"
      style={{
        backgroundColor: "var(--primary)",
        borderColor: "var(--primary)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
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
        </Link>
        <div className="ml-auto flex items-center gap-4 md:gap-6">
          <button
            type="button"
            className="md:hidden rounded-full border border-transparent p-2 transition hover:border-white/50"
            aria-label="Open menu"
            style={{
              color: "rgba(255,255,255,0.88)",
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
            onClick={() => setMobileOpen(true)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            </svg>
          </button>
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
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-white/30 px-3 py-1 text-sm font-medium transition hover:bg-white/10"
                  style={{ color: "rgba(255,255,255,0.9)", backgroundColor: "rgba(255,255,255,0.06)" }}
                >
                  <UserIcon />
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition ${menuOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  >
                    <path
                      d="m5 8 5 5 5-5"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-2xl border bg-white p-3 text-sm shadow-lg">
                    {profileLoading ? (
                      <div className="rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-[var(--text-secondary)]">
                        Checking permissions...
                      </div>
                    ) : (
                      <>
                        <Link
                          href="/account"
                          className="flex items-center justify-between rounded-lg px-3 py-2 font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]"
                          onClick={() => setMenuOpen(false)}
                        >
                          My Account
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                          >
                            <path
                              d="m9 18 6-6-6-6"
                              stroke="currentColor"
                              strokeWidth={1.8}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </Link>
                        {profileRole === "admin" && (
                          <Link
                            href="/admin"
                            className="flex items-center justify-between rounded-lg px-3 py-2 font-semibold text-[var(--secondary)] transition hover:bg-[var(--surface-muted)]"
                            onClick={() => setMenuOpen(false)}
                          >
                            Admin Dashboard
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                            >
                              <path
                                d="m9 18 6-6-6-6"
                                stroke="currentColor"
                                strokeWidth={1.8}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </Link>
                        )}
                      </>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="mt-1 w-full rounded-lg px-3 py-2 text-left font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]"
                      type="button"
                    >
                      Sign out
                    </button>
                  </div>
                )}
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
      {mobileOpen && (
        <div className="md:hidden">
          <div
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-0 left-0 z-40 flex h-full w-72 flex-col bg-[var(--surface)] shadow-xl ring-1 ring-[var(--border)] transition">
            <div className="flex items-center justify-between px-4 py-4">
              <Link
                href="/"
                className="flex items-center gap-3"
                onClick={() => setMobileOpen(false)}
              >
                <span className="inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-white p-1 shadow-sm">
                  <Image
                    src="/UTampa_logo.svg"
                    alt="University of Tampa Makerspace logo"
                    width={32}
                    height={32}
                  />
                </span>
                <span className="font-heading text-base font-semibold uppercase tracking-wide text-[var(--text-primary)]">
                  UT MAKERSPACE
                </span>
              </Link>
              <button
                type="button"
                aria-label="Close menu"
                className="rounded-full border border-[var(--border)] p-2 text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]"
                onClick={() => setMobileOpen(false)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                >
                  <path
                    d="M6 6l12 12M18 6l-12 12"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <div className="mt-2 border-t border-[var(--border)]" />
            <nav className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="rounded-lg px-3 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              {user && (
                <Link
                  href="/account"
                  className="rounded-lg px-3 py-3 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]"
                  onClick={() => setMobileOpen(false)}
                >
                  My Account
                </Link>
              )}
              {profileRole === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-lg px-3 py-3 text-sm font-semibold text-[var(--secondary)] transition hover:bg-[var(--surface-muted)]"
                  onClick={() => setMobileOpen(false)}
                >
                  Admin Dashboard
                </Link>
              )}
            </nav>
            <div className="mt-auto px-4 pb-6">
              {user ? (
                <button
                  type="button"
                  onClick={async () => {
                    setMobileOpen(false);
                    await handleSignOut();
                  }}
                  className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="block w-full rounded-lg border border-[var(--border)] px-3 py-2 text-center text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--surface-muted)]"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
