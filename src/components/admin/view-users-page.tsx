"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { canModifyUserRoles, isFacultyOrAdmin, UserRole } from "@/utils/permissions";

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

type DatabaseUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  student_id: string | null;
};

const supabase = createClient();

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
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [managingUserId, setManagingUserId] = useState<string | null>(null);
  const [certCounts, setCertCounts] = useState<Record<string, { count: number; machines: string[] }>>({});
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);

  // Fetch current user role
  async function fetchCurrentUserRole() {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setError('Authentication required');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        setError('Failed to fetch user role');
        return;
      }

      setCurrentUserRole(profile?.role || 'student');
    } catch (err) {
      console.error('Error fetching current user role:', err);
      setError('Failed to fetch user role');
    }
  }

  // Fetch users from database
  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setError('Failed to fetch users: ' + error.message);
        return;
      }

      // Transform database users to display format
      const transformedUsers: UserRecord[] = (data || []).map((dbUser: DatabaseUser) => {
        const fullName = [dbUser.first_name, dbUser.last_name].filter(Boolean).join(' ') || 'No Name';
        
        return {
          id: dbUser.id,
          name: fullName,
          email: dbUser.email || 'No Email',
          role: dbUser.role || 'student',
          status: dbUser.status || 'pending',
          joinedDate: new Date(dbUser.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          lastActive: new Date(dbUser.updated_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          trainingsCompleted: 0 // TODO: Calculate from training records when implemented
        };
      });

      setUsers(transformedUsers);
    } catch (err) {
      setError('An unexpected error occurred while fetching users');
      console.error('Users fetch error:', err);
    }
  }

  async function fetchTrainingCounts() {
    try {
      const { data, error } = await supabase
        .from('training_certificates')
        .select('user_id, machine_name');

      if (error) {
        console.error('Training certificates fetch error:', error);
        setError('Failed to load training data: ' + error.message);
        return;
      }

      const map: Record<string, { count: number; machines: string[] }> = {};
      (data || []).forEach((row) => {
        const userId = (row as { user_id: string }).user_id;
        const machineName = (row as { machine_name: string | null }).machine_name;
        if (!map[userId]) {
          map[userId] = { count: 0, machines: [] };
        }
        map[userId].count += 1;
        if (machineName) {
          map[userId].machines.push(machineName);
        }
      });

      setCertCounts(map);
      setUsers(prev =>
        prev.map(user => ({
          ...user,
          trainingsCompleted: map[user.id]?.count ?? 0,
        }))
      );
    } catch (err) {
      console.error('Unexpected error while fetching training data:', err);
      setError('An unexpected error occurred while fetching training data');
    }
  }

  // Update user in database
  async function updateUser(userId: string, updates: Partial<{ role: UserRole; status: UserStatus }>) {
    setUpdateLoading(userId);
    console.log('Attempting to update user:', userId, 'with:', updates);
    
    try {
      // Check current user authentication
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        console.error('Authentication error:', authError);
        setError('Authentication required to update users');
        return false;
      }
      console.log('Current authenticated user:', currentUser.id);

      // Perform the update
      const { data, error, count } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select(); // Add select to return updated data

      console.log('Update result:', { data, error, count });

      if (error) {
        console.error('Database update error:', error);
        setError(`Failed to update user: ${error.message} (Code: ${error.code})`);
        return false;
      }

      if (!data || data.length === 0) {
        console.warn('No rows were updated. User might not exist or RLS might be blocking the update.');
        setError('No user was updated. Check permissions or user existence.');
        return false;
      }

      console.log('Successfully updated user:', data[0]);

      // Update local state
      setUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, ...updates }
            : user
        )
      );
      
      return true;
    } catch (err) {
      console.error('Unexpected error during user update:', err);
      setError('An unexpected error occurred while updating user');
      return false;
    } finally {
      setUpdateLoading(null);
    }
  }

  // Load users on component mount
  useEffect(() => {
    async function loadUsers() {
      setLoading(true);
      await fetchCurrentUserRole();
      await fetchUsers();
      await fetchTrainingCounts();
      setLoading(false);
    }
    
    loadUsers();
  }, []);

  const handleSuspendUser = async (userId: string) => {
    const success = await updateUser(userId, { status: "suspended" });
    if (success) {
      setManagingUserId(null);
    }
  };

  const handleActivateUser = async (userId: string) => {
    const success = await updateUser(userId, { status: "active" });
    if (success) {
      setManagingUserId(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    const success = await updateUser(userId, { role: newRole });
    if (success) {
      setManagingUserId(null);
    }
  };

  const handleOverrideCertificates = async (userId: string) => {
    setUpdateLoading(userId);
    try {
      // Get all available machines
      const { data: machines, error: machinesError } = await supabase
        .from('machines')
        .select('id, name');

      if (machinesError) {
        setError('Failed to fetch machines: ' + machinesError.message);
        return;
      }

      // Delete existing certificates for this user
      const { error: deleteError } = await supabase
        .from('training_certificates')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        setError('Failed to clear existing certificates: ' + deleteError.message);
        return;
      }

      // Insert new certificates for all machines
      const certificates = machines?.map(machine => ({
        user_id: userId,
        machine_name: machine.name,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        issued_by: 'faculty_override'
      })) || [];

      if (certificates.length > 0) {
        const { error: insertError } = await supabase
          .from('training_certificates')
          .insert(certificates);

        if (insertError) {
          setError('Failed to create certificates: ' + insertError.message);
          return;
        }
      }

      // Refresh certificate counts
      await fetchTrainingCounts();
      setManagingUserId(null);
      
    } catch (err: any) {
      console.error('Error overriding certificates:', err);
      setError('Failed to override certificates: ' + err.message);
    } finally {
      setUpdateLoading(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user: UserRecord) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : user.status === statusFilter;
      const matchesRole = roleFilter === "all" ? true : user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [search, statusFilter, roleFilter, users]);

  const stats = useMemo(() => {
    const trainedActive = users.filter((user) => user.status === "active" && (certCounts[user.id]?.count ?? 0) > 0).length;
    const totals = {
      active: users.filter((user) => user.status === "active").length,
      pending: users.filter((user) => user.status === "pending").length,
      suspended: users.filter((user) => user.status === "suspended").length,
    };

    return [
      {
        title: "Total Users",
        value: users.length,
        change: `${users.length} registered`,
      },
      {
        title: "Active & Trained",
        value: trainedActive,
        change: "Active users with at least one cert",
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
  }, [users]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <p>Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4 text-2xl">⚠️ Error</div>
          <p className="mb-4">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              fetchUsers();
            }} 
            className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

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
            of <span className="font-semibold">{users.length}</span> users
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
                      {isFacultyOrAdmin(currentUserRole) && (
                        <button
                          type="button"
                          onClick={() => setManagingUserId(user.id)}
                          disabled={updateLoading === user.id}
                          className={`rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:border-[var(--secondary)] hover:text-[var(--text-primary)] ${updateLoading === user.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {updateLoading === user.id ? 'Updating...' : 'Manage'}
                        </button>
                      )}
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

      {/* Management Modal */}
      {managingUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            {(() => {
              const user = users.find(u => u.id === managingUserId);
              if (!user) return null;

              return (
                <>
                  <h3 className="text-lg font-semibold mb-4">
                    Manage {user.name}
                  </h3>
                  <div className="space-y-4">
                    {canModifyUserRoles(currentUserRole) && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Status</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleActivateUser(user.id)}
                            disabled={updateLoading === user.id}
                            className="px-3 py-2 text-sm bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 disabled:opacity-50"
                          >
                            Activate
                          </button>
                          <button
                            onClick={() => handleSuspendUser(user.id)}
                            disabled={updateLoading === user.id}
                            className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                          >
                            Suspend
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {canModifyUserRoles(currentUserRole) && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Role</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleChangeRole(user.id, 'student')}
                            disabled={updateLoading === user.id}
                            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                          >
                            Student
                          </button>
                          <button
                            onClick={() => handleChangeRole(user.id, 'faculty')}
                            disabled={updateLoading === user.id}
                            className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50"
                          >
                            Faculty
                          </button>
                          <button
                            onClick={() => handleChangeRole(user.id, 'admin')}
                            disabled={updateLoading === user.id}
                            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                          >
                            Admin
                          </button>
                        </div>
                      </div>
                    )}

                    {isFacultyOrAdmin(currentUserRole) && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Training Certificates</p>
                        <div className="text-xs text-gray-500 mb-2">
                          Current: {certCounts[user.id]?.count || 0} certificates for {certCounts[user.id]?.machines.join(', ') || 'none'}
                        </div>
                        <button
                          onClick={() => handleOverrideCertificates(user.id)}
                          disabled={updateLoading === user.id}
                          className="px-3 py-2 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50"
                        >
                          Override All Certificates
                        </button>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <button
                        onClick={() => setManagingUserId(null)}
                        className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
