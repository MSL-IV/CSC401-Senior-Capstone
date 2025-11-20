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
      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-white md:flex-row md:justify-between">
        <div className="flex flex-col items-start gap-3 text-left md:flex-row md:gap-6">
          <span className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/95 p-1 shadow-sm">
            <Image src="/UTampa_logo.svg" alt="UT Makerspace logo" width={48} height={48} priority />
          </span>
          <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
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
            <p>© 2025 University of Tampa Makerspace</p>
          </div>
        </div>
        <div className="text-center md:text-right">
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
      </section>
    </footer>
  );
}
