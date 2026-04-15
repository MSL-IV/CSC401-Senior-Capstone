"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { NAME_COLUMN, normalizeTag, rowsToTagMap, TAG_COLUMN, TAG_LOOKUP_TABLE } from "@/utils/rfid";

// Mirror the auth form logic: allow any syntactically valid email.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CheckoutRecord = {
  id: string;
  user_email: string;
  tags: string[];
  status?: string | null;
  created_at?: string;
};

export function KioskPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [checkouts, setCheckouts] = useState<CheckoutRecord[]>([]);
  const [tagMap, setTagMap] = useState<Record<string, string>>({});
  const [loadingCheckouts, setLoadingCheckouts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const tagFieldRef = useRef<HTMLInputElement>(null);

  const emailIsValid = EMAIL_PATTERN.test(email.trim());

  useEffect(() => {
    tagFieldRef.current?.focus();
    loadCheckouts();
    const interval = setInterval(loadCheckouts, 30_000); // refresh every 30s to persist across reloads/closures
    return () => clearInterval(interval);
  }, []);

  const loadTagNames = async (tagsToLookup: string[]) => {
    const missing = tagsToLookup
      .map(normalizeTag)
      .filter((tag) => tag && !(tag in tagMap));
    if (!missing.length) return;

    const { data, error } = await supabase
      .from(TAG_LOOKUP_TABLE)
      .select("*")
      .in(TAG_COLUMN, missing);

    if (error) {
      console.warn(`RFID lookup failed from ${TAG_LOOKUP_TABLE}:`, error.message);
      return;
    }

    const mapped = rowsToTagMap((data ?? []) as Record<string, unknown>[]);
    if (Object.keys(mapped).length) {
      setTagMap((prev) => ({ ...prev, ...mapped }));
    }
  };

  const loadCheckouts = async () => {
    setLoadingCheckouts(true);
    const { data, error } = await supabase
      .from("kiosk_checkouts")
      .select("*")
      .neq("status", "returned")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setCheckouts(data as CheckoutRecord[]);
      const uniqueTags = Array.from(
        new Set((data as CheckoutRecord[]).flatMap((c) => c.tags || []))
      );
      await loadTagNames(uniqueTags);
    }
    setLoadingCheckouts(false);
  };

  const resolveTagLabel = (tag: string) => {
    const normalized = normalizeTag(tag);
    return tagMap[normalized] ?? normalized;
  };

  const addTag = async (value: string) => {
    const rawTag = normalizeTag(value);
    if (!rawTag) return;

    if (!emailIsValid) {
      setSubmitMessage("Valid email required before saving checkout.");
      return;
    }

    setSubmitting(true);
    setSubmitMessage(null);

    const checkoutEmail = email.trim().toLowerCase();

    try {
      const { data: matchedUsers, error: accountError } = await supabase
        .from("profiles")
        .select("id")
        .ilike("email", checkoutEmail)
        .limit(1);

      if (accountError) {
        setSubmitMessage(`Unable to verify account: ${accountError.message}`);
        return;
      }

      if (!matchedUsers || matchedUsers.length === 0) {
        setSubmitMessage(
          "No account found for that email. Please create an account before checking out equipment.",
        );
        return;
      }

      // Look up friendly name for display while keeping the raw tag for storage/uniqueness
      const { data: tagRow, error: lookupError } = await supabase
        .from(TAG_LOOKUP_TABLE)
        .select("*")
        .eq(TAG_COLUMN, rawTag)
        .maybeSingle();

      let friendlyName: string | null = null;

      if (lookupError) {
        console.warn(`RFID lookup failed from ${TAG_LOOKUP_TABLE}:`, lookupError.message);
      } else if (tagRow) {
        const row = tagRow as Record<string, unknown>;
        const nameValue = row[NAME_COLUMN];
        if (typeof nameValue === "string" || typeof nameValue === "number") {
          const nameString = String(nameValue);
          friendlyName = nameString;
          setTagMap((prev) => ({ ...prev, [rawTag]: nameString }));
        }
      }

      // Prevent duplicate checkouts and enable scan-to-return.
      // Match against raw tag and any friendly name already stored in historical rows.
      const overlapTags = [rawTag];
      const noLeadingZeros = rawTag.replace(/^0+/, "");
      if (noLeadingZeros && noLeadingZeros !== rawTag) overlapTags.push(noLeadingZeros);
      if (friendlyName && friendlyName !== rawTag) overlapTags.push(friendlyName);

      const { data: existingRows, error: existingError } = await supabase
        .from("kiosk_checkouts")
        .select("*")
        .overlaps("tags", overlapTags)
        .neq("status", "returned")
        .limit(1);

      if (existingError) {
        setSubmitMessage(`Failed to check existing checkouts: ${existingError.message}`);
        return;
      }

      const existing = (existingRows?.[0] ?? null) as CheckoutRecord | null;

      if (existing) {
        if (existing.user_email.toLowerCase() !== checkoutEmail) {
          setSubmitMessage(`Tag is already checked out by ${existing.user_email}.`);
          return;
        }

        // Same user re-scanned: mark returned
        const { error: returnError } = await supabase
          .from("kiosk_checkouts")
          .update({ status: "returned" })
          .eq("id", existing.id);

        if (returnError) {
          setSubmitMessage(`Failed to return item: ${returnError.message}`);
          return;
        }

        setCheckouts((prev) => prev.filter((c) => c.id !== existing.id));
        setSubmitMessage(`Returned tag ${resolveTagLabel(rawTag)} for ${checkoutEmail}.`);
        return;
      }

      // No active checkout found: create new record
      const { data, error } = await supabase
        .from("kiosk_checkouts")
        .insert({
          user_email: checkoutEmail,
          tags: [rawTag],
          status: "open",
        })
        .select()
        .single();

      if (error) {
        setSubmitMessage(`Failed to save: ${error.message}`);
        return;
      }

      if (data) {
        setCheckouts((prev) => [data as CheckoutRecord, ...prev]);
        await loadTagNames([rawTag]);
      }

      setSubmitMessage(`Saved tag ${resolveTagLabel(rawTag)} to Supabase`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setSubmitMessage(`Failed to save: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTagSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailTouched(true);

    // Block checkouts when email is missing or invalid
    if (!emailIsValid) {
      return;
    }

    await addTag(tagInput);
    setTagInput("");
    tagFieldRef.current?.focus();
  };

  const summary = useMemo(() => {
    const allTags = checkouts.flatMap((c) => c.tags || []);
    const last = checkouts[0]?.created_at ? new Date(checkouts[0].created_at).getTime() : null;
    return {
      count: allTags.length,
      last,
      unique: new Set(allTags).size,
    };
  }, [checkouts]);

  const emailDisplay = email.trim() || "Email not set";

  return (
    <div className="space-y-6">
      <section
        className="rounded-3xl border bg-[var(--surface)] p-6 shadow-sm"
        style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-soft)" }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              Kiosk Mode
            </p>
            <h1 className="font-heading text-3xl font-bold text-[var(--text-primary)]">
              Equipment Checkout
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--text-secondary)]">
              Station for RFID-based equipment checkout. Keep the scanner focused on the tag field below; items appear instantly as they are scanned.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <section
          className="md:col-span-2 rounded-3xl border bg-[var(--surface)] p-6 shadow-sm"
          style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-soft)" }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                Scan Equipment
              </p>
              <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)]">RFID Tag Input</h2>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
                Checkout email: <span className={emailIsValid ? "text-[var(--text-primary)]" : "text-red-600"}>{emailDisplay}</span>
              </p>
            </div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              {summary.count === 0 ? "Awaiting first scan" : `${summary.count} item${summary.count === 1 ? "" : "s"} captured`}
            </div>
          </div>

          <form onSubmit={handleTagSubmit} className="mt-4 flex flex-col gap-3 md:flex-row">
            <input
              ref={tagFieldRef}
              value={tagInput}
              onChange={(event) => setTagInput(event.target.value)}
              placeholder="Scan tag or enter ID"
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-lg font-mono tracking-wide text-[var(--text-primary)] outline-none transition focus:border-[var(--secondary)]"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <button
              type="submit"
              disabled={!emailIsValid || !tagInput.trim() || submitting}
              className="rounded-2xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Add"}
            </button>
          </form>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">Total Scans</p>
              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{summary.count}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">Unique Tags</p>
              <p className="mt-2 text-3xl font-bold text-[var(--text-primary)]">{summary.unique}</p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">Last Scan</p>
              <p className="mt-2 text-base font-semibold text-[var(--text-primary)]">
                {summary.last ? new Date(summary.last).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "—"}
              </p>
            </div>
          </div>

          {submitMessage && (
            <div className="mt-4 text-sm text-[var(--text-secondary)]">
              {submitting ? "Saving..." : submitMessage}
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">Equipment in Session</h3>
              <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                {summary.unique} unique
              </span>
            </div>

            {loadingCheckouts ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-6 text-center text-sm text-[var(--text-secondary)]">
                Loading checkouts...
              </div>
            ) : checkouts.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-6 text-center text-sm text-[var(--text-secondary)]">
                Scanned items will appear here. Keep the cursor in the tag field for uninterrupted scans.
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {checkouts.map((checkout) => (
                  <div
                    key={checkout.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[var(--text-secondary)]">
                        {new Date(checkout.created_at ?? Date.now()).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                      </span>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
                        Return by rescanning
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">Email</p>
                      <span className="inline-flex items-center rounded-full bg-[var(--surface-muted)] px-3 py-1 text-sm font-semibold text-[var(--text-primary)]">
                        {checkout.user_email}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {checkout.tags?.map((tag) => (
                          <span
                            key={tag}
                            title={tag}
                            className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-semibold text-[var(--text-primary)]"
                          >
                            {resolveTagLabel(tag)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <aside
          className="rounded-3xl border bg-[var(--surface)] p-6 shadow-sm"
          style={{ borderColor: "var(--border)", boxShadow: "var(--shadow-soft)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
            User Email
          </p>
          <h2 className="font-heading text-2xl font-bold text-[var(--text-primary)]">Who is checking out?</h2>

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder="you@spartans.ut.edu"
            className={`mt-4 w-full rounded-2xl border px-4 py-3 text-base text-[var(--text-primary)] outline-none transition focus:border-[var(--secondary)] ${
              emailTouched && !emailIsValid
                ? "border-red-400 focus:border-red-400"
                : "border-[var(--border)] bg-[var(--surface-muted)]"
            }`}
            autoComplete="email"
            required
            pattern={EMAIL_PATTERN.source}
            title="Enter a valid email address"
          />

          <div className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            emailIsValid ? "bg-[var(--surface-muted)] text-[var(--text-secondary)]" : "bg-red-50 text-red-700"
          }`}>
            Current email
            <span className="text-[var(--text-primary)]">{emailDisplay}</span>
          </div>

          {!emailIsValid && emailTouched && (
            <p className="mt-2 text-sm text-red-600">A valid email is required before scanning items.</p>
          )}

          <Link
            href="/auth"
            className="mt-4 inline-flex rounded-full border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[var(--primary)] hover:text-[var(--text-primary)]"
          >
            Don&apos;t have an account?
          </Link>

          <div className="mt-6 space-y-3 text-sm text-[var(--text-secondary)]">
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[var(--secondary)]" aria-hidden />
              <p>Keep this window in full-screen on the kiosk device to avoid distractions.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-[var(--secondary)]" aria-hidden />
              <p>Each tag can only be checked out by one email at a time. Re-scan the same tag with the original email to return it.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
