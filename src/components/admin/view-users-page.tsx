"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from 'next/navigation';
import { createClient } from "@/utils/supabase/client";

// Create a consistent Supabase client instance
const supabase = createClient();

type UserStatus = "active" | "pending" | "suspended";
type UserRole = "student" | "faculty" | "admin";

type UserRecord = {
  id: string;
  name: string;
  email: string;
  studentId: string;
  role: UserRole;
  status: UserStatus;
  joinedDate: string;
  lastActive: string;
  trainingsCompleted: number;
};

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | UserStatus>("all");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [managementLoading, setManagementLoading] = useState(false);
  const router = useRouter();

  // Set up authentication listener
  useEffect(() => {
    // Check current session first
    const checkSession = async () => {
      try {
        // Check what's in localStorage first
        const localStorageKeys = Object.keys(localStorage).filter(key => 
          key.includes('supabase') || key.includes('auth')
        );
        console.log('Auth-related localStorage keys:', localStorageKeys);
        console.log('Supabase client created successfully');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', { 
          session: !!session, 
          user: session?.user?.email, 
          userId: session?.user?.id,
          error,
          accessToken: session?.access_token ? 'present' : 'missing',
          refreshToken: session?.refresh_token ? 'present' : 'missing'
        });
        
        if (session?.user) {
          setIsAuthenticated(true);
          await fetchUsers();
        } else {
          setIsAuthenticated(false);
          setUsers([]);
          setError('No active session found. Please sign in to access the admin panel.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Session check error:', err);
        setError('Failed to check authentication status: ' + (err as Error).message);
        setLoading(false);
      }
    };
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        if (session?.user) {
          setIsAuthenticated(true);
          await fetchUsers();
        } else {
          setIsAuthenticated(false);
          setUsers([]);
          if (event === 'SIGNED_OUT') {
            setLoading(false);
          }
        }
      }
    );
    
    // Initial session check
    checkSession();
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fetch users from Supabase
  async function fetchUsers() {
    try {
      setLoading(true);
      console.log('Checking authentication...');
        
      // Get current session (should already be validated by the auth listener)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session for data fetch:', { session: !!session, user: session?.user?.email, sessionError });
      
      if (sessionError || !session?.user) {
        console.log('No valid session for data fetch');
        setIsAuthenticated(false);
        setError('Authentication session expired. Please sign in again.');
        setLoading(false);
        return;
      }
      
      console.log('Fetching data for user:', session.user.email);
      console.log('User ID:', session.user.id);
      console.log('Fetching profiles...');
      
      // First, let's check if the profiles table exists and has any data at all
      const { data: tableCheck, error: tableError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });
      
      console.log('Table existence check:', { tableCheck, tableError });
      
      // Fetch profiles with detailed logging to see what fields are available
      const { data: profiles, error: profilesError, status, statusText } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Profiles query result:', { 
        profiles, 
        profilesError, 
        status, 
        statusText,
        count: profiles?.length || 0 
      });

      if (profilesError) {
        console.error('Profiles error details:', profilesError);
        setError('Failed to fetch user profiles: ' + profilesError.message);
        return;
      }

      if (!profiles || profiles.length === 0) {
        console.log('No profiles found in database');
        
        // Check if this is an RLS issue by trying to check current user's profile specifically
        const { data: myProfile, error: myProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        console.log('Current user profile check:', { myProfile, myProfileError });
        
        setUsers([]);
        setError('No users found in the database. This could mean:\n' +
                '1. No accounts have been created yet\n' +
                '2. The profiles table is empty\n' +
                '3. Row Level Security is blocking access\n' +
                '4. You need to create your profile first by signing up through the auth page');
        return;
      }

      // Transform profiles into UserRecord format
      const combinedUsers: UserRecord[] = profiles.map((profile, index) => {
        console.log(`Processing profile ${index + 1}:`, profile);
        
        // Check if we have an email field in the profile data
        let userEmail = 'Email not available';
        
        // Check various possible email field names
        if (profile.email) {
          userEmail = profile.email;
        } else if (profile.user_email) {
          userEmail = profile.user_email;
        } else {
          // Log available fields to help debug
          console.log('Available profile fields:', Object.keys(profile));
        }
        
        return {
          id: profile.id,
          name: profile.first_name && profile.last_name 
            ? `${profile.first_name} ${profile.last_name}` 
            : 'No Name Set',
          email: userEmail,
          studentId: profile.student_id || 'Not Set',
          role: (profile.role || 'student') as UserRole,
          status: (profile.status || 'pending') as UserStatus,
          joinedDate: new Date(profile.created_at).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          }),
          lastActive: profile.updated_at 
            ? formatLastActive(profile.updated_at)
            : 'No recent activity',
          trainingsCompleted: 0,
        };
      });

      console.log('Transformed users:', combinedUsers);
      setUsers(combinedUsers);
      setError(null);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Helper function to format last active time
  function formatLastActive(lastUpdate: string): string {
    const now = new Date();
    const updateDate = new Date(lastUpdate);
    const diffInHours = Math.floor((now.getTime() - updateDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hrs ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    
    return updateDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }

  // Update user status in database
  async function updateUserStatus(userId: string, newStatus: UserStatus) {
    try {
      setManagementLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Update error:', error);
        setError(`Failed to update user status: ${error.message}`);
        return false;
      }

      // Refresh the user list
      await fetchUsers();
      return true;
    } catch (err) {
      console.error('Unexpected error updating user:', err);
      setError('Failed to update user status');
      return false;
    } finally {
      setManagementLoading(false);
    }
  }

  // Update user role in database
  async function updateUserRole(userId: string, newRole: UserRole) {
    try {
      setManagementLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Update error:', error);
        setError(`Failed to update user role: ${error.message}`);
        return false;
      }

      // Refresh the user list
      await fetchUsers();
      return true;
    } catch (err) {
      console.error('Unexpected error updating user role:', err);
      setError('Failed to update user role');
      return false;
    } finally {
      setManagementLoading(false);
    }
  }

  // Handle manage button click
  function handleManageUser(user: UserRecord) {
    setSelectedUser(user);
    setShowManageModal(true);
  }

  // Handle user management actions
  async function handleUserAction(action: string) {
    if (!selectedUser) return;

    let success = false;
    
    switch (action) {
      case 'suspend':
        success = await updateUserStatus(selectedUser.id, 'suspended');
        break;
      case 'activate':
        success = await updateUserStatus(selectedUser.id, 'active');
        break;
      case 'pending':
        success = await updateUserStatus(selectedUser.id, 'pending');
        break;
      case 'promote-admin':
        success = await updateUserRole(selectedUser.id, 'admin');
        break;
      case 'promote-faculty':
        success = await updateUserRole(selectedUser.id, 'faculty');
        break;
      case 'demote-student':
        success = await updateUserRole(selectedUser.id, 'student');
        break;
    }

    if (success) {
      setShowManageModal(false);
      setSelectedUser(null);
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.studentId.toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : user.status === statusFilter;
      const matchesRole = roleFilter === "all" ? true : user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const stats = useMemo(() => {
    const totals = {
      active: users.filter((user) => user.status === "active").length,
      pending: users.filter((user) => user.status === "pending").length,
      suspended: users.filter((user) => user.status === "suspended").length,
    };

    return [
      {
        title: "Total Users",
        value: users.length,
        change: "+New registrations", 
      },
      {
        title: "Active & Trained",
        value: totals.active,
        change: users.length > 0 ? `${Math.round((totals.active / users.length) * 100)}% of user base` : "0%",
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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--text-primary)",
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
          <p>Loading users...</p>
          <p className="text-sm text-gray-500 mt-2">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          backgroundColor: "var(--background)",
          color: "var(--text-primary)",
        }}
      >
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4 text-2xl">
            {!isAuthenticated ? "🔒" : "⚠️"} 
            {!isAuthenticated ? " Authentication Required" : " Error"}
          </div>
          <p className="mb-4 whitespace-pre-line">{error}</p>
          
          {!isAuthenticated ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                You need to be signed in to access the admin panel.
              </p>
              <div className="text-left bg-gray-100 p-4 rounded-lg mb-4">
                <p className="text-sm font-semibold mb-2">Troubleshooting:</p>
                <ol className="text-sm list-decimal list-inside space-y-1">
                  <li>Sign in through the auth page</li>
                  <li>Make sure you stay on the same domain</li>
                  <li>Check if cookies are enabled</li>
                  <li>Try clearing browser data if issues persist</li>
                </ol>
              </div>
              <div className="space-y-2">
                <button 
                  onClick={() => router.push('/auth')} 
                  className="w-full px-6 py-3 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition font-semibold"
                >
                  Go to Sign In
                </button>
                <button 
                  onClick={() => window.location.reload()} 
                  className="w-full px-6 py-3 bg-gray-500 text-white rounded-lg hover:opacity-90 transition"
                >
                  Refresh Page
                </button>
                <button 
                  onClick={async () => {
                    console.log('Manual session refresh...');
                    const { data: { session }, error } = await supabase.auth.getSession();
                    console.log('Manual session check result:', { session: !!session, error });
                    if (session) {
                      setIsAuthenticated(true);
                      await fetchUsers();
                    }
                  }} 
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:opacity-90 transition"
                >
                  Check Session Again
                </button>
              </div>
            </div>
          ) : (
            <div className="text-left bg-gray-100 p-4 rounded-lg mb-4">
              <p className="text-sm font-semibold mb-2">Troubleshooting steps:</p>
              <ol className="text-sm list-decimal list-inside space-y-1">
                <li>Make sure you've run the latest SQL script</li>
                <li>Try creating a test account</li>
                <li>Check the profiles table in Supabase dashboard</li>
                <li>Verify RLS policies are set correctly</li>
              </ol>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:opacity-90 transition w-full"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Rest of the component remains the same...
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
              className="rounded-3xl border bg-white p-6 shadow-sm"
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
          className="space-y-5 rounded-3xl border bg-white p-6 shadow-sm"
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
                  placeholder="Search by name or student ID"
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
            <div className="flex items-center gap-2">
              {(["all", "student", "faculty", "admin"] as const).map(
                (role) => (
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
                ),
              )}
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
                      <div className="text-xs text-[var(--text-secondary)]">
                        Student ID: {user.studentId}
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
                        onClick={() => handleManageUser(user)}
                        className="rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary)] transition hover:border-[var(--secondary)] hover:text-[var(--text-primary)]"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && users.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
                <p className="mb-2">No users found in the database.</p>
                <p className="text-xs">Create an account first, then check this page again.</p>
              </div>
            )}
            {filteredUsers.length === 0 && users.length > 0 && (
              <div className="px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
                No users match the current filters. Adjust your search or try a
                different status.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* User Management Modal */}
      {showManageModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Manage User: {selectedUser.name}
              </h3>
              <button
                onClick={() => setShowManageModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Student ID:</strong> {selectedUser.studentId}</p>
                <p><strong>Current Role:</strong> {roleLabels[selectedUser.role]}</p>
                <p><strong>Current Status:</strong> {statusStyles[selectedUser.status].label}</p>
                <p><strong>Joined:</strong> {selectedUser.joinedDate}</p>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-[var(--text-primary)] mb-3">Status Actions</h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedUser.status !== 'active' && (
                    <button
                      onClick={() => handleUserAction('activate')}
                      disabled={managementLoading}
                      className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                    >
                      {managementLoading ? 'Processing...' : '✓ Activate User'}
                    </button>
                  )}
                  {selectedUser.status !== 'pending' && (
                    <button
                      onClick={() => handleUserAction('pending')}
                      disabled={managementLoading}
                      className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition disabled:opacity-50"
                    >
                      {managementLoading ? 'Processing...' : '⏳ Set Pending Training'}
                    </button>
                  )}
                  {selectedUser.status !== 'suspended' && (
                    <button
                      onClick={() => handleUserAction('suspend')}
                      disabled={managementLoading}
                      className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                    >
                      {managementLoading ? 'Processing...' : '🚫 Suspend User'}
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-[var(--text-primary)] mb-3">Role Management</h4>
                <div className="grid grid-cols-1 gap-2">
                  {selectedUser.role !== 'admin' && (
                    <button
                      onClick={() => handleUserAction('promote-admin')}
                      disabled={managementLoading}
                      className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition disabled:opacity-50"
                    >
                      {managementLoading ? 'Processing...' : '👑 Promote to Admin'}
                    </button>
                  )}
                  {selectedUser.role !== 'faculty' && selectedUser.role !== 'admin' && (
                    <button
                      onClick={() => handleUserAction('promote-faculty')}
                      disabled={managementLoading}
                      className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                    >
                      {managementLoading ? 'Processing...' : '🎓 Promote to Faculty'}
                    </button>
                  )}
                  {selectedUser.role !== 'student' && (
                    <button
                      onClick={() => handleUserAction('demote-student')}
                      disabled={managementLoading}
                      className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
                    >
                      {managementLoading ? 'Processing...' : '🎒 Change to Student'}
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <button
                  onClick={() => setShowManageModal(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}