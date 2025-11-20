"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Navbar } from "@/components/navbar";

const inputStyles =
  "w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm shadow-sm outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[rgba(200,16,46,0.2)]";

const labelStyles = "text-sm font-medium text-neutral-700";

export function LoginPage() {
  const [loginData, setLoginData] = useState({ email: "", password: "", remember: false });
  const [signupData, setSignupData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    major: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    console.log('Attempting login with:', { email: loginData.email });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      console.log('Login result:', { 
        user: data?.user?.id, 
        session: !!data?.session,
        error: error?.message 
      });

      if (error) {
        setLoginError(error.message);
        console.error('Login error:', error);
      } else if (data?.session) {
        console.log('Login successful, session created');
        
        // Check if session is actually stored
        const { data: { session: storedSession } } = await supabase.auth.getSession();
        console.log('Session verification:', { 
          stored: !!storedSession, 
          accessToken: storedSession?.access_token ? 'present' : 'missing' 
        });
        
        // Check localStorage after login
        const authKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('auth')
        );
        console.log('Post-login localStorage keys:', authKeys);
        
        // Redirect to dashboard or home page on successful login
        router.push("/");
      } else {
        setLoginError('Login successful but no session created');
      }
    } catch (error) {
      setLoginError("An unexpected error occurred. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupLoading(true);
    setSignupError("");
    setSignupSuccess(false);

    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      setSignupError("Passwords do not match.");
      setSignupLoading(false);
      return;
    }

    // Validate terms acceptance
    if (!signupData.terms) {
      setSignupError("Please accept the terms and conditions.");
      setSignupLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          data: {
            first_name: signupData.firstName,
            last_name: signupData.lastName,
            major: signupData.major,
          },
        },
      });

      if (error) {
        setSignupError(error.message);
      } else {
        setSignupSuccess(true);
        // Reset form
        setSignupData({
          firstName: "",
          lastName: "",
          email: "",
          major: "",
          password: "",
          confirmPassword: "",
          terms: false,
        });
      }
    } catch (error) {
      setSignupError("An unexpected error occurred. Please try again.");
    } finally {
      setSignupLoading(false);
    }
  };
  return (
    <div
      className="min-h-screen bg-neutral-100"
      style={{ backgroundColor: "var(--background)" }}
    >
      <Navbar />
      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12 lg:flex-row lg:py-20">
        <section className="flex w-full flex-col justify-center gap-6 rounded-2xl border border-neutral-200 bg-white p-8 shadow-md lg:max-w-md">
          <p
            className="font-heading text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--primary)" }}
          >
            Makerspace Portal
          </p>
          <h1 className="text-3xl font-semibold text-neutral-900">
            Welcome back, Makers!
          </h1>
          <p
            className="text-sm text-neutral-600"
            style={{ color: "var(--text-secondary)" }}
          >
            Log into your account to manage reservations, track equipment
            certifications, and stay on top of your project milestones.
          </p>
          {loginError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {loginError}
            </div>
          )}
          <form onSubmit={handleLogin} className="mt-4 space-y-4" aria-label="Log in form">
            <div className="space-y-2">
              <label htmlFor="login-email" className={labelStyles}>
                University Email
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@spartans.ut.edu"
                className={inputStyles}
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="login-password" className={labelStyles}>
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                className={inputStyles}
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-neutral-600">
                <input
                  type="checkbox"
                  name="remember"
                  className="h-4 w-4 rounded border-neutral-300 text-[var(--primary)] focus:ring-[rgba(200,16,46,0.3)]"
                  checked={loginData.remember}
                  onChange={(e) => setLoginData({ ...loginData, remember: e.target.checked })}
                />
                Remember me
              </label>
              <Link
                href="#"
                className="font-semibold transition hover:opacity-80"
                style={{ color: "var(--primary)" }}
              >
                Forgot password?
              </Link>
            </div>
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white shadow transition hover:brightness-90 disabled:opacity-50"
              style={{
                backgroundColor: "var(--primary)",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              {loginLoading ? "Logging in..." : "Log in"}
            </button>
          </form>
          <p className="text-sm text-neutral-600">
            Need an account?{" "}
            <a
              href="#create-account"
              className="font-semibold transition hover:opacity-80"
              style={{ color: "var(--primary)" }}
            >
              Create one below
            </a>
          </p>
        </section>
        <section
          id="create-account"
          className="flex w-full flex-1 flex-col justify-center gap-8 rounded-2xl border p-8 shadow-inner"
          style={{
            borderColor: "rgba(200, 16, 46, 0.12)",
            background:
              "linear-gradient(135deg, rgba(200,16,46,0.05), rgba(10,31,58,0.03))",
          }}
        >
          <div className="space-y-2">
            <h2
              className="text-2xl font-semibold text-neutral-900"
              style={{ color: "var(--text-primary)" }}
            >
              Create a Makerspace Account
            </h2>
            <p
              className="text-sm text-neutral-600"
              style={{ color: "var(--text-secondary)" }}
            >
              Unlock fabrication equipment, schedule workshops, and collaborate
              with fellow innovators. Provide your basic information so we can
              get you started.
            </p>
          </div>
          {signupError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {signupError}
            </div>
          )}
          {signupSuccess && (
            <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              Account created successfully! Please check your email to verify your account.
            </div>
          )}
          <form
            onSubmit={handleSignup}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
            aria-label="Create account form"
          >
            <div className="space-y-2">
              <label htmlFor="signup-first-name" className={labelStyles}>
                First Name
              </label>
              <input
                id="signup-first-name"
                name="firstName"
                type="text"
                placeholder="Taylor"
                autoComplete="given-name"
                className={inputStyles}
                value={signupData.firstName}
                onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-last-name" className={labelStyles}>
                Last Name
              </label>
              <input
                id="signup-last-name"
                name="lastName"
                type="text"
                placeholder="Rivera"
                autoComplete="family-name"
                className={inputStyles}
                value={signupData.lastName}
                onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-email" className={labelStyles}>
                University Email
              </label>
              <input
                id="signup-email"
                name="email"
                type="email"
                placeholder="you@spartans.ut.edu"
                autoComplete="email"
                className={inputStyles}
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-major" className={labelStyles}>
                Program or Major
              </label>
              <input
                id="signup-major"
                name="major"
                type="text"
                placeholder="Design & Technical Theatre"
                className={inputStyles}
                value={signupData.major}
                onChange={(e) => setSignupData({ ...signupData, major: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-password" className={labelStyles}>
                Password
              </label>
              <input
                id="signup-password"
                name="password"
                type="password"
                placeholder="Create a password"
                autoComplete="new-password"
                className={inputStyles}
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="signup-confirm" className={labelStyles}>
                Confirm Password
              </label>
              <input
                id="signup-confirm"
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                autoComplete="new-password"
                className={inputStyles}
                value={signupData.confirmPassword}
                onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-start gap-3 text-xs text-neutral-600">
                <input
                  type="checkbox"
                  name="terms"
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-[var(--primary)] focus:ring-[rgba(200,16,46,0.3)]"
                  checked={signupData.terms}
                  onChange={(e) => setSignupData({ ...signupData, terms: e.target.checked })}
                  required
                />
                I agree to follow all makerspace safety guidelines, attend
                required training, and uphold the University of Tampa code of
                conduct.
              </label>
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={signupLoading}
                className="w-full rounded-lg border px-4 py-2 text-sm font-semibold text-white shadow transition hover:brightness-95 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--primary)",
                  borderColor: "var(--primary)",
                  boxShadow: "var(--shadow-soft)",
                }}
              >
                {signupLoading ? "Creating account..." : "Create account"}
              </button>
            </div>
          </form>
          <div className="space-y-3 rounded-xl border border-white/60 bg-white/80 p-6 text-sm text-neutral-600 shadow-sm">
            <p className="font-semibold text-neutral-800">
              What happens next?
            </p>
            <ul className="space-y-2">
              <li>• A makerspace coordinator will verify your eligibility.</li>
              <li>
                • You will receive an email with training requirements and next
                steps.
              </li>
              <li>
                • Once approved, you can reserve machines and join workshops.
              </li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
