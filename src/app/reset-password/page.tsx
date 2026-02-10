"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";

export default function ResetPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const supabase = createClient();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setMessage("");

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/login`,
        });

        if (error) {
            setError(error.message);
        } else {
            setMessage("Check your email for the password reset link.");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ backgroundColor: "var(--background)" }}>
            <Navbar />

            <main className="flex flex-1 items-center justify-center p-6">
                <div className="w-full max-w-md rounded-3xl bg-white shadow-lg p-8">
                    <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-4">Reset Password</h1>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">
                        Enter your email address and we’ll send you a link to reset your password.
                    </p>

                    {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}
                    {message && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded">{message}</div>}

                    <form onSubmit={handleReset} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="you@spartans.ut.edu"
                                className="w-full rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(200,16,46,0.2)]"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-[var(--primary)] px-4 py-3 text-white font-semibold shadow hover:brightness-90 disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send Reset Link"}
                        </button>
                    </form>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
