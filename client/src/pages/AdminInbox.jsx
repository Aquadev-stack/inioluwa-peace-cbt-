import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, clearAuth } from "../api/authStorage";
import { http } from "../api/http";
import logo from "../assets/logo.png";

export default function AdminInbox() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth?.user;

  useEffect(() => {
    if (!auth?.token) navigate("/", { replace: true });
    if (user?.role !== "admin") navigate("/dashboard", { replace: true });
  }, [auth?.token, user?.role, navigate]);

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function loadReports() {
    setErr("");
    setLoading(true);
    try {
      const res = await http.get("/reports");
      setReports(res.data?.reports || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role === "admin") loadReports();
    const t = setInterval(() => {
      if (user?.role === "admin") loadReports();
    }, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const unreadCount = useMemo(
    () => reports.filter((r) => r.status === "unread").length,
    [reports]
  );

  async function markRead(id) {
    setErr("");
    try {
      await http.put(`/api/reports/${id}/read`);
      setReports((prev) => prev.map((r) => (r._id === id ? { ...r, status: "read" } : r)));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to mark read");
    }
  }

  // ✅ put your functions here
  async function archive(id) {
    setErr("");
    try {
      await http.put(`/api/reports/${id}/archive`);
      setReports((prev) => prev.map((r) => (r._id === id ? { ...r, status: "archived" } : r)));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to archive");
    }
  }

  async function removeReport(id) {
    const ok = confirm("Delete this report permanently?");
    if (!ok) return;

    setErr("");
    try {
      await http.delete(`/api/reports/${id}`);
      setReports((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to delete");
    }
  }

  function logout() {
    clearAuth();
    navigate("/", { replace: true });
  }

  return (
    <div className="space-y-4 pt-2 pb-8">
      {/* Header */}
      <div
        className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-5
        [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden">
              <img src={logo} alt="INIOLUWA PEACE CBT" className="h-10 w-10 object-contain" />
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-semibold truncate">Admin Inbox</h2>
              <p className="text-sm text-white/70 [html[data-theme='light']_&]:text-slate-600 mt-1">
                Reports from students • {unreadCount} unread
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/dashboard/admin")}
              className="rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-sm hover:bg-black/25 transition cursor-pointer
              [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
            >
              Back to Admin
            </button>

            <button
              onClick={logout}
              className="rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 px-3 py-2 text-sm font-medium hover:bg-red-500/20 transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>

        {err && (
          <div className="mt-4 text-sm bg-red-500/15 border border-red-500/30 text-red-200 px-3 py-2 rounded-xl">
            {err}
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-sm text-white/70 [html[data-theme='light']_&]:text-slate-600">
            Latest first. Unread shows “NEW”.
          </p>

          <button
            onClick={loadReports}
            className="rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-xs hover:bg-white/15 transition cursor-pointer
              [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-white/70 [html[data-theme='light']_&]:text-slate-600">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div
            className="rounded-2xl bg-black/20 border border-white/10 p-6 text-sm text-white/70
            [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:text-slate-600"
          >
            No reports yet.
          </div>
        ) : (
          reports.map((r) => (
            <div
              key={r._id}
              className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-5
                [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{r.title}</p>
                  <p className="text-xs text-white/70 [html[data-theme='light']_&]:text-slate-600 mt-1">
                    {r.fromMatric ? r.fromMatric : "Unknown matric"} •{" "}
                    {r.fromLevel ? `${r.fromLevel}lv` : "Unknown level"} • {formatDate(r.createdAt)}
                  </p>
                </div>

                {r.status === "unread" ? (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#7CFF6B]/15 border border-[#7CFF6B]/40 text-[#7CFF6B]">
                    NEW
                  </span>
                ) : r.status === "archived" ? (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#EFBF04]/15 border border-[#EFBF04]/40 text-[#EFBF04]">
                    ARCHIVED
                  </span>
                ) : (
                  <span
                    className="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/15 text-white/70
                    [html[data-theme='light']_&]:text-slate-600"
                  >
                    READ
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm text-white/80 [html[data-theme='light']_&]:text-slate-700 whitespace-pre-wrap">
                {r.message}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {r.status === "unread" && (
                  <button
                    onClick={() => markRead(r._id)}
                    className="rounded-xl bg-[#0A8270]/30 border border-[#7CFF6B]/30 px-3 py-2 text-xs hover:bg-[#0A8270]/40 transition cursor-pointer"
                  >
                    Mark as read
                  </button>
                )}

                {r.status !== "archived" && (
                  <button
                    onClick={() => archive(r._id)}
                    className="rounded-xl bg-[#EFBF04]/15 border border-[#EFBF04]/40 px-3 py-2 text-xs hover:bg-[#EFBF04]/20 transition cursor-pointer"
                  >
                    Archive
                  </button>
                )}

                <button
                  onClick={() => removeReport(r._id)}
                  className="rounded-xl bg-red-500/15 border border-red-500/30 px-3 py-2 text-xs hover:bg-red-500/20 transition text-red-200 cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleString();
  } catch {
    return "";
  }
}
