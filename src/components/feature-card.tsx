import Link from "next/link";
import { ReactNode } from "react";

type FeatureCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  href?: string;
};

export function FeatureCard({ icon, title, description, href }: FeatureCardProps) {
  const CardContent = () => (
    <div
      className="flex h-full flex-col gap-3 border p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
      style={{
        backgroundColor: "var(--surface)",
        borderColor: "var(--border)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--shadow-soft)",
      }}
    >
      <div style={{ color: "var(--secondary)" }}>{icon}</div>
      <div>
        <h3
          className="font-heading text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h3>
        <p
          className="mt-2 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          {description}
        </p>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} aria-label={title} className="block h-full">
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
}
