export type AdminLink = {
  title: string;
  description: string;
  href: string;
  category: string;
  meta?: string;
  accent?: string;
};

export const adminLinks: AdminLink[] = [
  {
    title: "View Users",
    description:
      "Review sign-ups, roles, training progress, and manage account access.",
    href: "/admin/view-users",
    category: "People",
    meta: "Roster, status, certifications",
    accent: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Equipment",
    description:
      "Toggle availability and monitor who is actively using lab equipment.",
    href: "/admin/equipment",
    category: "Operations",
    meta: "Status, maintenance, live usage",
    accent: "bg-indigo-50 text-indigo-700",
  },
];
