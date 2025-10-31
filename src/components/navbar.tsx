import Image from "next/image";
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
  { name: "Home", href: "#" },
  { name: "Reserve a Time", href: "#" },
  { name: "Equipment Status", href: "#" },
  { name: "About", href: "#" },
];

export function Navbar() {
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
            <button
              type="button"
              className="rounded-full border border-transparent p-1 transition hover:border-white/50"
              aria-label="Account"
              style={{
                color: "rgba(255,255,255,0.88)",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              <UserIcon />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
