import React, { useEffect, useState } from "react";
import {
  ApiClient,
  type ApplicationResponse,
  type ApplicationCreate,
} from "./api";

export default function App() {
  // Core Data States
  const [apps, setApps] = useState<ApplicationResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Auth State
  const [isAdmin, setIsAdmin] = useState<boolean>(
    !!localStorage.getItem("basic_auth_token"),
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Creation Form State
  const [newApp, setNewApp] = useState<ApplicationCreate>({
    title: "",
    description: "",
    priority: "normal",
  });

  // UI Control States (Search, Filter, Sort)
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "title" | "priority-desc" | "priority-asc"
  >("newest");

  // Initial Fetch Data
  const fetchApplications = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const data = await ApiClient.listApplications();
      setApps(data);
    } catch (err) {
      // Check if it's a standard Error instance to access .message safely
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      // Only call your state-updating fetch if the component is still on screen
      if (isMounted) {
        await fetchApplications();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Actions: Authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    ApiClient.login(username, password);
    setIsAdmin(true);
    setUsername("");
    setPassword("");
  };

  const handleLogout = () => {
    ApiClient.logout();
    setIsAdmin(false);
  };

  // Actions: Create Application
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newApp.title.trim()) return;
    try {
      setApiError(null);
      const created = await ApiClient.createApplication(newApp);
      setApps((prev) => [created, ...prev]); // Prepend fresh record
      setNewApp({ title: "", description: "", priority: "normal" });
    } catch (err) {
      // Check if it's a standard Error instance to access .message safely
      if (err instanceof Error) {
        setApiError(err.message);
      } else {
        setApiError("An unexpected error occurred");
      }
    }
  };

  // Actions: Update Status (Inline Change)
  const handleStatusChange = async (
    id: string,
    newStatus: "new" | "in_progress" | "done",
  ) => {
    // 1. Find the application in your local state array first
    const currentApp = apps.find((app) => app.id === id);

    // 2. Block the change if it's already completed
    if (currentApp && currentApp.status.toUpperCase() === "DONE") {
      setApiError(
        "Modification Error: You cannot make changes to an application that is already marked as DONE.",
      );
      return; // Stop execution immediately
    }

    try {
      setApiError(null);
      const updated = await ApiClient.updateApplicationStatus(id, {
        status: newStatus,
      });
      setApps(apps.map((app) => (app.id === id ? updated : app)));
    } catch (err) {
      setApiError((err as Error).message || "Status update failed");
    }
  };

  // Actions: Delete (Protected Route)
  const handleDelete = async (id: string) => {
    const currentApp = apps.find((app) => app.id === id);

    if (currentApp && currentApp.status.toUpperCase() === "DONE") {
      setApiError(
        "Deletion Error: Completed applications are locked and cannot be deleted.",
      );
      return;
    }

    if (!window.confirm("Are you sure you want to delete this application?"))
      return;

    try {
      setApiError(null);
      await ApiClient.deleteApplication(id);
      setApps(apps.filter((app) => app.id !== id));
    } catch (err) {
      setApiError((err as Error).message || "Deletion failed");
    }
  };

  // Computed State: Filtering & Searching
  const filteredApps = apps.filter((app) => {
    const matchesSearch =
      app.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || app.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const priorityWeight: Record<string, number> = {
    high: 3,
    normal: 2,
    low: 1,
  };

  // Computed State: Sorting
  const sortedApps = [...filteredApps].sort((a, b) => {
    if (sortBy === "newest")
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    if (sortBy === "oldest")
      return (
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    if (sortBy === "title") return a.title.localeCompare(b.title);
    if (sortBy === "priority-desc") {
      const weightA = priorityWeight[a.priority.toLowerCase()] || 0;
      const weightB = priorityWeight[b.priority.toLowerCase()] || 0;
      return weightB - weightA;
    }

    // Sort by priority low -> high
    if (sortBy === "priority-asc") {
      const weightA = priorityWeight[a.priority.toLowerCase()] || 0;
      const weightB = priorityWeight[b.priority.toLowerCase()] || 0;
      return weightA - weightB;
    }

    return 0;
  });

  return (
    <div
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header View & Admin Authorization Session Control */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid #eee",
          paddingBottom: "16px",
          marginBottom: "24px",
        }}
      >
        <h2>Application Processing System</h2>
        <div>
          {isAdmin ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  backgroundColor: "#e6fffa",
                  color: "#006d5b",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "bold",
                }}
              >
                👑 Admin Mode
              </span>
              <button
                onClick={handleLogout}
                style={{
                  padding: "6px 12px",
                  cursor: "pointer",
                  background: "#333",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleLogin}
              style={{ display: "flex", gap: "8px" }}
            >
              <input
                type="text"
                placeholder="Admin User"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  padding: "6px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  padding: "6px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
                required
              />
              <button
                type="submit"
                style={{
                  padding: "6px 12px",
                  background: "#0066cc",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Login
              </button>
            </form>
          )}
        </div>
      </header>

      {/* Global API Error Banner */}
      {apiError && (
        <div
          style={{
            background: "#fff5f5",
            color: "#cc0000",
            border: "1px solid #cca3a3",
            padding: "12px",
            borderRadius: "6px",
            marginBottom: "20px",
            fontWeight: "500",
          }}
        >
          ⚠️ {apiError}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "320px 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* LEFT COLUMN: Creation Form Block */}
        <aside
          style={{
            background: "#f9f9f9",
            padding: "20px",
            borderRadius: "8px",
            border: "1px solid #eaeaea",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: "16px" }}>
            Submit New Application
          </h3>
          <form
            onSubmit={handleCreate}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Title
              <input
                type="text"
                value={newApp.title}
                onChange={(e) =>
                  setNewApp({ ...newApp, title: e.target.value })
                }
                placeholder="e.g. Broken pipeline fix"
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
                required
              />
            </label>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Description
              <textarea
                value={newApp.description}
                onChange={(e) =>
                  setNewApp({ ...newApp, description: e.target.value })
                }
                placeholder="Describe details..."
                rows={4}
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  resize: "vertical",
                }}
              />
            </label>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                fontSize: "14px",
                fontWeight: "600",
              }}
            >
              Priority
              <select
                value={newApp.priority}
                onChange={(e) =>
                  setNewApp({ ...newApp, priority: e.target.value as "normal" })
                }
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </label>
            <button
              type="submit"
              style={{
                padding: "10px",
                background: "#22c55e",
                color: "white",
                border: "none",
                borderRadius: "4px",
                fontWeight: "bold",
                cursor: "pointer",
                marginTop: "4px",
              }}
            >
              Add to Pipeline
            </button>
          </form>
        </aside>

        {/* RIGHT COLUMN: Controls & Data Rendering List */}
        <main>
          {/* Controls Bar: Filters, Search, Sort */}
          <section
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              background: "#f1f5f9",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          >
            <input
              type="text"
              placeholder="🔍 Search applications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
                flex: "1",
                minWidth: "200px",
              }}
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as "newest" | "oldest" | "title")
              }
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #cbd5e1",
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title">Alphabetical (Title)</option>
              <option value="priority-desc">Most priority first</option>
              <option value="priority-asc">Least priority first</option>
            </select>
          </section>

          {/* Core Content Loading/Empty/List Blocks */}
          {loading ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px",
                color: "#666",
                fontSize: "18px",
              }}
            >
              🔄 Fetching records from SQLite server...
            </div>
          ) : sortedApps.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px",
                border: "2px dashed #cbd5e1",
                borderRadius: "8px",
                color: "#64748b",
              }}
            >
              <h3>No matching records found</h3>
              <p style={{ margin: 0 }}>
                Try clearing filters or submit a brand new application record.
              </p>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {sortedApps.map((app) => (
                <div
                  key={app.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    padding: "16px",
                    borderRadius: "8px",
                    background: "white",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: "1", paddingRight: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "6px",
                      }}
                    >
                      <h4 style={{ margin: 0, fontSize: "18px" }}>
                        {app.title}
                      </h4>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          background:
                            app.priority === "high"
                              ? "#ffe4e6"
                              : app.priority === "normal"
                                ? "#fef3c7"
                                : "#f1f5f9",
                          color:
                            app.priority === "high"
                              ? "#991b1b"
                              : app.priority === "normal"
                                ? "#92400e"
                                : "#334155",
                        }}
                      >
                        {app.priority}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: "0 0 10px 0",
                        color: "#475569",
                        fontSize: "14px",
                      }}
                    >
                      {app.description || "No description provided."}
                    </p>
                    <small style={{ color: "#94a3b8", display: "block" }}>
                      ID: {app.id} • Created:{" "}
                      {new Date(app.created_at).toLocaleString()}
                    </small>
                  </div>

                  {/* Actions Area: Status Update and Delete Execution */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: "10px",
                      minWidth: "160px",
                    }}
                  >
                    <label
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                        fontSize: "12px",
                        color: "#64748b",
                        fontWeight: "600",
                      }}
                    >
                      Status Control
                      <select
                        value={app.status}
                        onChange={(e) =>
                          handleStatusChange(
                            app.id,
                            e.target.value as "new" | "in_progress" | "done",
                          )
                        }
                        style={{
                          padding: "6px",
                          borderRadius: "4px",
                          border: "1px solid #cbd5e1",
                          fontWeight: "normal",
                          background:
                            app.status === "in_progress"
                              ? "#f0fdf4"
                              : app.status === "done"
                                ? "#fdf2f2"
                                : "#fff",
                        }}
                      >
                        <option value="new">New</option>
                        <option value="in_progress">⏳ In progress</option>
                        <option value="done">✅ Done</option>
                      </select>
                    </label>

                    <button
                      onClick={() => handleDelete(app.id)}
                      disabled={!isAdmin}
                      style={{
                        padding: "6px 12px",
                        background: isAdmin ? "#ef4444" : "#cbd5e1",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "13px",
                        cursor: isAdmin ? "pointer" : "not-allowed",
                        fontWeight: "600",
                        transition: "background 0.2s",
                      }}
                      title={
                        !isAdmin
                          ? "Authenticate as Admin to unlock deletion"
                          : ""
                      }
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
