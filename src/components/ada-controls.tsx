"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Allow a wider range with finer increments (20 steps from 0.8x to 1.7x)
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.7;
const STEP = 0.05;
type Scale = number;
const THEME_KEY = "ada-theme";
const CONTRAST_KEY = "ada-contrast";
const ANIM_KEY = "ada-animations";
const HIGHLIGHT_KEY = "ada-highlight";

function clampScale(value: number): Scale {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(value.toFixed(2))));
}

export default function AdaControls() {
  const [open, setOpen] = useState(false);
  const [bodyScale, setBodyScale] = useState<Scale>(1);
  const [headingScale, setHeadingScale] = useState<Scale>(1);
  const [otherScale, setOtherScale] = useState<Scale>(1);
  const [darkMode, setDarkMode] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [animationsOff, setAnimationsOff] = useState(false);
  const [highlightLinks, setHighlightLinks] = useState(false);
  const [showTextDetails, setShowTextDetails] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load saved values once
  useEffect(() => {
    const load = (key: string, fallback: Scale) => {
      const saved = window.localStorage.getItem(key);
      const num = saved ? Number(saved) : fallback;
      return clampScale(Number.isFinite(num) ? num : fallback);
    };
    setBodyScale(load("ada-font-body", 1));
    setHeadingScale(load("ada-font-heading", 1));
    setOtherScale(load("ada-font-other", 1));

    const storedTheme = window.localStorage.getItem(THEME_KEY);
    if (storedTheme === "dark") {
      setDarkMode(true);
    }
    const storedContrast = window.localStorage.getItem(CONTRAST_KEY);
    if (storedContrast === "on") {
      setHighContrast(true);
    }
    const storedAnim = window.localStorage.getItem(ANIM_KEY);
    if (storedAnim === "off") {
      setAnimationsOff(true);
    }
    const storedHighlight = window.localStorage.getItem(HIGHLIGHT_KEY);
    if (storedHighlight === "on") {
      setHighlightLinks(true);
    }
  }, []);

  // Apply to CSS variables and persist
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--ada-body-scale", String(bodyScale));
    root.style.setProperty("--ada-heading-scale", String(headingScale));
    root.style.setProperty("--ada-other-scale", String(otherScale));
    window.localStorage.setItem("ada-font-body", String(bodyScale));
    window.localStorage.setItem("ada-font-heading", String(headingScale));
    window.localStorage.setItem("ada-font-other", String(otherScale));
    root.setAttribute("data-ada-theme", darkMode ? "dark" : "light");
    window.localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
    if (highContrast) {
      root.setAttribute("data-ada-contrast", "on");
      window.localStorage.setItem(CONTRAST_KEY, "on");
    } else {
      root.removeAttribute("data-ada-contrast");
      window.localStorage.setItem(CONTRAST_KEY, "off");
    }
    if (animationsOff) {
      root.setAttribute("data-ada-animations", "off");
      window.localStorage.setItem(ANIM_KEY, "off");
    } else {
      root.removeAttribute("data-ada-animations");
      window.localStorage.setItem(ANIM_KEY, "on");
    }
    if (highlightLinks) {
      root.setAttribute("data-ada-highlight", "on");
      window.localStorage.setItem(HIGHLIGHT_KEY, "on");
    } else {
      root.removeAttribute("data-ada-highlight");
      window.localStorage.setItem(HIGHLIGHT_KEY, "off");
    }
  }, [
    bodyScale,
    headingScale,
    otherScale,
    darkMode,
    highContrast,
    animationsOff,
    highlightLinks,
  ]);

  const resetAll = () => {
    setBodyScale(1);
    setHeadingScale(1);
    setOtherScale(1);
    setDarkMode(false);
    setHighContrast(false);
    setAnimationsOff(false);
    setHighlightLinks(false);
    window.localStorage.removeItem(THEME_KEY);
    window.localStorage.removeItem(CONTRAST_KEY);
    window.localStorage.removeItem(ANIM_KEY);
    window.localStorage.removeItem(HIGHLIGHT_KEY);
    window.localStorage.removeItem("ada-font-body");
    window.localStorage.removeItem("ada-font-heading");
    window.localStorage.removeItem("ada-font-other");
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const groupedScale = useMemo(
    () => bodyScale === headingScale && headingScale === otherScale,
    [bodyScale, headingScale, otherScale]
  );

  const adjust = (
    target: "body" | "heading" | "other" | "all",
    dir: -1 | 1
  ) => {
    const change = (value: Scale) => clampScale(value + STEP * dir);
    if (target === "all") {
      const next = change(bodyScale);
      setBodyScale(next);
      setHeadingScale(next);
      setOtherScale(next);
      return;
    }
    if (target === "body") setBodyScale(change(bodyScale));
    if (target === "heading") setHeadingScale(change(headingScale));
    if (target === "other") setOtherScale(change(otherScale));
  };

  return (
    <div
      ref={containerRef}
      className="fixed bottom-4 right-4 z-50 text-sm text-gray-800"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="font-semibold">ADA</span>
        <span className="text-xs text-gray-600">
          {groupedScale ? `Font ${bodyScale.toFixed(2)}x` : "Custom"}
        </span>
      </button>

      {open ? (
        <div className="mt-2 w-64 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold text-gray-800">Font size</p>
            <button
              type="button"
              onClick={resetAll}
              className="text-xs text-blue-600 hover:underline"
            >
              Reset all
            </button>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Theme</p>
                <p className="text-xs text-gray-500">Toggle dark mode</p>
              </div>
              <button
                type="button"
                onClick={() => setDarkMode((v) => !v)}
                className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
                aria-pressed={darkMode}
                aria-label="Toggle dark mode"
              >
                {darkMode ? "Dark on" : "Dark off"}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">High contrast</p>
                <p className="text-xs text-gray-500">Stronger text/background</p>
              </div>
              <button
                type="button"
                onClick={() => setHighContrast((v) => !v)}
                className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
                aria-pressed={highContrast}
                aria-label="Toggle high contrast mode"
              >
                {highContrast ? "Contrast on" : "Contrast off"}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Animations</p>
                <p className="text-xs text-gray-500">Pause page motion</p>
              </div>
              <button
                type="button"
                onClick={() => setAnimationsOff((v) => !v)}
                className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
                aria-pressed={animationsOff}
                aria-label="Toggle animations"
              >
                {animationsOff ? "Paused" : "On"}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Highlight links</p>
                <p className="text-xs text-gray-500">Underline + outline links</p>
              </div>
              <button
                type="button"
                onClick={() => setHighlightLinks((v) => !v)}
                className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50"
                aria-pressed={highlightLinks}
                aria-label="Toggle link highlight"
              >
                {highlightLinks ? "Highlight on" : "Highlight off"}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">All text</p>
                <p className="text-xs text-gray-500">Body, headings, labels</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjust("all", -1)}
                  className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
                  aria-label="Decrease all font sizes"
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => adjust("all", 1)}
                  className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
                  aria-label="Increase all font sizes"
                >
                  A+
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowTextDetails((v) => !v)}
              className="mt-1 text-left text-xs font-semibold text-blue-600 hover:underline"
              aria-expanded={showTextDetails}
            >
              {showTextDetails ? "Hide individual text controls" : "Show individual text controls"}
            </button>

            {showTextDetails ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Headings</p>
                    <p className="text-xs text-gray-500">{headingScale.toFixed(2)}x</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjust("heading", -1)}
                      className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
                      aria-label="Decrease heading font size"
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onClick={() => adjust("heading", 1)}
                      className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
                      aria-label="Increase heading font size"
                    >
                      A+
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Body</p>
                    <p className="text-xs text-gray-500">{bodyScale.toFixed(2)}x</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjust("body", -1)}
                      className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
                      aria-label="Decrease body font size"
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onClick={() => adjust("body", 1)}
                      className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
                      aria-label="Increase body font size"
                    >
                      A+
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Labels & other</p>
                    <p className="text-xs text-gray-500">{otherScale.toFixed(2)}x</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjust("other", -1)}
                      className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
                      aria-label="Decrease other font size"
                    >
                      A-
                    </button>
                    <button
                      type="button"
                      onClick={() => adjust("other", 1)}
                      className="rounded border border-gray-300 px-2 py-1 hover:bg-gray-50"
                      aria-label="Increase other font size"
                    >
                      A+
                    </button>
                  </div>
                </div>
              </>
            ) : null}

          </section>
        </div>
      ) : null}
    </div>
  );
}
