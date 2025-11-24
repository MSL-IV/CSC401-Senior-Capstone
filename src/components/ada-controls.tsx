"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// Allow a wider range with finer increments (20 steps from 0.8x to 1.7x)
const MIN_SCALE = 0.8;
const MAX_SCALE = 1.7;
const STEP = 0.05;
type Scale = number;

function clampScale(value: number): Scale {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(value.toFixed(2))));
}

export default function AdaControls() {
  const [open, setOpen] = useState(false);
  const [bodyScale, setBodyScale] = useState<Scale>(1);
  const [headingScale, setHeadingScale] = useState<Scale>(1);
  const [otherScale, setOtherScale] = useState<Scale>(1);
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
  }, [bodyScale, headingScale, otherScale]);

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
              onClick={() => {
                setBodyScale(1);
                setHeadingScale(1);
                setOtherScale(1);
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              Reset
            </button>
          </div>

          <section className="space-y-2">
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
          </section>
        </div>
      ) : null}
    </div>
  );
}
