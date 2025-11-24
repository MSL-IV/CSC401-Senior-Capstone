"use client";

import { useMemo, useState } from "react";

type UserStatus = "active" | "pending" | "suspended";
type UserRole = "student" | "faculty" | "admin";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  joinedDate: string;
  lastActive: string;
  trainingsCompleted: number;
};

const mockUsers: UserRecord[] = [
  {
    id: "u-001",
    name: "Maya Patel",
    email: "maya.patel@ut.edu",
    role: "student",
    status: "active",
    joinedDate: "Jan 12, 2024",
    lastActive: "2 hrs ago",
    trainingsCompleted: 4,
  },
  {
    id: "u-002",
    name: "Jordan Evans",
    email: "jordan.evans@ut.edu",
    role: "student",
    status: "pending",
    joinedDate: "Jan 26, 2024",
    lastActive: "Awaiting training",
    trainingsCompleted: 1,
  },
  {
    id: "u-003",
    name: "Elena Ruiz",
    email: "elena.ruiz@ut.edu",
    role: "faculty",
    status: "active",
    joinedDate: "Dec 05, 2023",
    lastActive: "Yesterday",
    trainingsCompleted: 6,
  },
  {
    id: "u-004",
    name: "Noah Davis",
    email: "noah.davis@ut.edu",
    role: "admin",
    status: "suspended",
    joinedDate: "Nov 18, 2023",
    lastActive: "Feb 04, 2024",
    trainingsCompleted: 2,
  },
  {
    id: "u-005",
    name: "Grace Huang",
    email: "grace.huang@ut.edu",
    role: "student",
    status: "active",
    joinedDate: "Feb 02, 2024",
    lastActive: "45 mins ago",
    trainingsCompleted: 3,
  },
  {
    id: "u-006",
    name: "Professor Reed",
    email: "l.reed@ut.edu",
    role: "faculty",
    status: "pending",
    joinedDate: "Jan 30, 2024",
    lastActive: "Awaiting training",
    trainingsCompleted: 0,
  },
];

const statusStyles: Record<
  UserStatus,
  { label: string; text: string; bg: string; dot: string }
> = {
  active: {
    label: "Active",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "Pending Training",
    text: "text-amber-700",
    bg: "bg-amber-50",
    dot: "bg-amber-400",
  },
  suspended: {
    label: "Suspended",
    text: "text-rose-700",
    bg: "bg-rose-50",
    dot: "bg-rose-500",
  },
};

const roleLabels: Record<UserRole, string> = {
  student: "Student",
  faculty: "Faculty",
  admin: "Admin",
};

export function ViewUsersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  const filteredUsers = useMemo(() => {
    return mockUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : user.status === statusFilter;
      const matchesRole = roleFilter === "all" ? true : user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [search, statusFilter, roleFilter]);

  const stats = useMemo(() => {
    const totals = {
      active: mockUsers.filter((user) => user.status === "active").length,
      pending: mockUsers.filter((user) => user.status === "pending").length,
      suspended: mockUsers.filter((user) => user.status === "suspended").length,
    };

    return [
      {
        title: "Total Users",
        value: mockUsers.length,
        change: "+6 this month",
      },
      {
        title: "Active & Trained",
        value: totals.active,
        change: "72% of user base",
        accent: "text-emerald-600",
      },
      {
        title: "Awaiting Training",
        value: totals.pending,
        change: "Send reminders",
        accent: "text-amber-600",
      },
      {
        title: "Suspended Accounts",
        value: totals.suspended,
        change: "Needs review",
        accent: "text-rose-600",
      },
    ];
  }, []);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--text-primary)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-3">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              Admin / Users
            </p>
            <div>
              <h1 className="font-heading text-3xl font-bold md:text-4xl">
                Makerspace Members
              </h1>
              <p className="text-base text-[var(--text-secondary)]">
                Review new sign-ups, track training progress, and manage account
                access from one dashboard.
              </p>
            </div>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.title}
              className="rounded-3xl border bg-[var(--surface)] p-6 shadow-sm"
              style={{
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-soft)",
              }}
            >
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                {stat.title}
              </p>
              <p className="mt-4 font-heading text-3xl font-bold">
                {stat.value}
              </p>
              <p
                className={`mt-2 text-sm font-semibold ${
                  stat.accent ?? "text-[var(--text-secondary)]"
                }`}
              >
                {stat.change}
              </p>
            </article>
          ))}
        </section>

        <section
          className="space-y-5 rounded-3xl border bg-[var(--surface)] p-6 shadow-sm"
          style={{
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-soft)",
          }}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-secondary)]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                  >
                    <path
                      d="m21 21-4.35-4.35M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name or email"
                  className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-11 py-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--secondary)] focus:bg-white"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "active", "pending", "suspended"] as const).map(
                  (status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setStatusFilter(status)}
                      className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                        statusFilter === status
                          ? "border-[var(--secondary)] bg-[var(--secondary)] text-white"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--secondary-accent)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {status === "all"
                        ? "All Statuses"
                        : statusStyles[status].label}
                    </button>
                  ),
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(["all", "student", "faculty", "admin"] as const).map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setRoleFilter(role)}
                  className={`rounded-[var(--radius-button)] px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    roleFilter === role
                      ? "bg-[var(--primary)] text-white"
                      : "border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {role === "all" ? "All Roles" : roleLabels[role]}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--text-secondary)]">
            Showing <span className="font-semibold">{filteredUsers.length}</span>{" "}
            of <span className="font-semibold">{mockUsers.length}</span> users
            based on current filters.
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[var(--border)]">
              <thead className="text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                <tr>
                  <th className="py-3 pr-4">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Training</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Last Active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="text-sm transition hover:bg-[var(--surface-muted)]"
                  >
                    <td className="py-4 pr-4">
                      <div className="font-semibold text-[var(--text-primary)]">
                        {user.name}
                      </div>
                      <div className="text-[var(--text-secondary)]">
                        {user.email}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold capitalize text-[var(--text-primary)]">
                      {roleLabels[user.role]}
                    </td>
                    <td className="px-4 py-4 text-[var(--text-secondary)]">
                      {user.trainingsCompleted} certifications
                      <p className="text-xs text-[var(--text-secondary)]">
                        Joined {user.joinedDate}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[user.status].bg} ${statusStyles[user.status].text}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${statusStyles[user.status].dot}`}
                        />
                        {statusStyles[user.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[var(--text-secondary)]">
                      {user.lastActive}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:border-[var(--secondary)] hover:text-[var(--text-primary)]"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
                No users match the current filters. Adjust your search or try a
                different status.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
