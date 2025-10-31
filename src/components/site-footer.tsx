export function SiteFooter() {
  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: "var(--primary)",
        borderColor: "var(--primary)",
      }}
    >
      <div
        className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 py-8 text-center text-sm md:flex-row md:justify-between"
        style={{ color: "var(--on-primary)" }}
      >
        <span>© 2025 University of Tampa Makerspace</span>
        <div className="flex items-center gap-6">
          <a
            href="#"
            className="transition-opacity hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            Contact
          </a>
          <a
            href="#"
            className="transition-opacity hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            Policies
          </a>
          <a
            href="#"
            className="transition-opacity hover:opacity-80"
            style={{ color: "rgba(255,255,255,0.9)" }}
          >
            FAQ
          </a>
        </div>
      </div>
    </footer>
  );
}
