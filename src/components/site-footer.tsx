import Image from "next/image";

const footerLinks = [
  { name: "Home", href: "/" },
  { name: "Reserve a Time", href: "/reserve" },
  { name: "Equipment Status", href: "/equipment-status" },
  { name: "About", href: "/about" },
];

export function SiteFooter() {
  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: "var(--primary)",
        borderColor: "var(--primary)",
      }}
    >
      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-white md:flex-row md:items-start md:justify-start md:gap-10">
        <div className="flex items-start gap-3 text-left">
          <span className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/95 p-1 shadow-sm">
            <Image src="/UTampa_logo.svg" alt="UT Makerspace logo" width={48} height={48} priority />
          </span>
          <div className="flex flex-col">
            <p className="text-sm font-semibold uppercase tracking-wide">UT Makerspace</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.8)" }}>
              University of Tampa
            </p>
          </div>
        </div>

        {/* Mobile: links and hours side by side */}
        <div className="flex w-full flex-col gap-6 md:hidden">
          <div className="flex w-full flex-row items-start gap-6">
            <div className="flex-1">
              <p className="text-sm font-semibold uppercase tracking-wide underline underline-offset-4">
                Quick Links
              </p>
              <nav className="mt-2 flex flex-col gap-2 text-sm font-medium">
                {footerLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="transition-opacity hover:opacity-80"
                    style={{ color: "rgba(255,255,255,0.9)" }}
                  >
                    {link.name}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold uppercase tracking-wide underline underline-offset-4">
                Business Hours
              </p>
              <div className="mt-2 space-y-1">
                {[
                  "Monday 10 AM - 5 PM",
                  "Tuesday 10 AM - 5 PM",
                  "Wednesday 10 AM - 5 PM",
                  "Thursday 10 AM - 5 PM",
                  "Friday 10 AM - 4 PM",
                ].map((day) => (
                  <p key={day}>{day}</p>
                ))}
              </div>
            </div>
          </div>
          <p className="text-left text-xs text-white/80">© 2025 University of Tampa Makerspace</p>
        </div>

        {/* Desktop: original layout */}
        <div className="hidden w-full items-start justify-between gap-10 md:flex">
          <div className="flex flex-col items-start gap-3 text-left">
            <p className="text-sm font-semibold uppercase tracking-wide underline underline-offset-4">
              Quick Links
            </p>
            <nav className="flex flex-col gap-2 text-sm font-medium">
              {footerLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="transition-opacity hover:opacity-80"
                  style={{ color: "rgba(255,255,255,0.9)" }}
                >
                  {link.name}
                </a>
              ))}
            </nav>
            <p className="text-xs text-white/80">
              © 2025 University of Tampa Makerspace
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm font-semibold uppercase tracking-wide underline underline-offset-4">
              Business Hours
            </p>
            <div className="space-y-1">
              {[
                "Monday 10 AM - 5 PM",
                "Tuesday 10 AM - 5 PM",
                "Wednesday 10 AM - 5 PM",
                "Thursday 10 AM - 5 PM",
                "Friday 10 AM - 4 PM",
              ].map((day) => (
                <p key={day}>{day}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </footer>
  );
}
