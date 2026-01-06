// client/src/pages/LeaderboardPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { courses100_1st, courses200_1st } from "../data/courses";
import { http } from "../api/http";
import { io } from "socket.io-client";

// ---------- socket (single instance) ----------
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";
let _socket = null;

function getSocket() {
  if (_socket) return _socket;
  _socket = io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: true,
  });
  return _socket;
}

// ---------- helpers ----------
function formatTime(seconds) {
  if (seconds == null || Number.isNaN(seconds)) return "--:--";
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function LeaderboardTable({ rows }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="min-w-[640px] w-full border-separate border-spacing-y-3">
        <thead>
          <tr className="text-left text-xs text-white/60">
            <th className="px-3 pb-1">Rank</th>
            <th className="px-3 pb-1">Student</th>
            <th className="px-3 pb-1">Result</th>
            <th className="px-3 pb-1">Time</th>
            <th className="px-3 pb-1">Date</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((row) => {
            const pct = Number(row.scorePercent ?? 0);
            const top = row.viewRank <= 3;

            return (
              <tr
                key={row._id}
                className={[
                  "bg-black/15",
                  top ? "shadow-[0_0_0_2px_rgba(16,185,129,0.10)]" : "",
                ].join(" ")}
              >
                <td className="px-3 py-3">
                  <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-extrabold">
                    #{row.viewRank}
                  </span>
                </td>

                <td className="px-3 py-3 text-sm">
                  <div className="max-w-[220px] truncate">{row.studentName}</div>
                </td>

                <td className="px-3 py-3">
                  <span className="text-lg font-extrabold">{pct}%</span>
                </td>

                <td className="px-3 py-3 text-sm">
                  {formatTime(row.timeSpentSeconds)}
                </td>

                <td className="px-3 py-3 text-sm text-white/80">
                  {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "--"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-2 text-[11px] text-white/50 lg:hidden">
        Tip: swipe left/right to view full table.
      </div>
    </div>
  );
}

// ✅ Mobile bottom-sheet modal (scroll lock safe)
function MobileModal({ open, onClose, title, subtitle, children }) {
  const prevOverflowRef = React.useRef(null);

  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // scroll lock
  useEffect(() => {
    if (open) {
      if (prevOverflowRef.current === null) {
        prevOverflowRef.current = document.body.style.overflow || "";
      }
      document.body.style.overflow = "hidden";
      return;
    }

    if (prevOverflowRef.current !== null) {
      document.body.style.overflow = prevOverflowRef.current;
      prevOverflowRef.current = null;
    }
  }, [open]);

  // restore on unmount
  useEffect(() => {
    return () => {
      if (prevOverflowRef.current !== null) {
        document.body.style.overflow = prevOverflowRef.current;
        prevOverflowRef.current = null;
      }
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
        aria-label="Close modal"
      />

      <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0f14] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="min-w-0">
            <div className="text-lg font-extrabold truncate">{title}</div>
            {subtitle ? (
              <div className="mt-1 text-xs text-white/70 truncate">{subtitle}</div>
            ) : null}
          </div>

          <button
            onClick={onClose}
            className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white/90 hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="max-h-[calc(85vh-72px)] overflow-y-auto px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [activeLevel, setActiveLevel] = useState(100);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("rank"); // rank | time
  const [mobileOpen, setMobileOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ detect lg breakpoint (Tailwind lg = 1024px)
  const [isLgUp, setIsLgUp] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(min-width: 1024px)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e) => setIsLgUp(e.matches);

    // Safari fallback
    if (mq.addEventListener) mq.addEventListener("change", onChange);
    else mq.addListener(onChange);

    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", onChange);
      else mq.removeListener(onChange);
    };
  }, []);

  // ✅ if we enter desktop, force-close mobile modal so body scroll never locks
  useEffect(() => {
    if (isLgUp && mobileOpen) setMobileOpen(false);
  }, [isLgUp, mobileOpen]);

  const courses = useMemo(
    () => (activeLevel === 100 ? courses100_1st : courses200_1st),
    [activeLevel]
  );

  // pick default course per level
  useEffect(() => {
    if (!selectedCourse) {
      setSelectedCourse(courses[0] ?? null);
      return;
    }
    const exists = courses.some((c) => c.code === selectedCourse.code);
    if (!exists) setSelectedCourse(courses[0] ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLevel]);

  // fetch + realtime subscription
  useEffect(() => {
    if (!selectedCourse) return;

    const socket = getSocket();
    const courseCode = selectedCourse.code;
    const level = activeLevel;

    let cancelled = false;

    async function fetchLeaderboard() {
      setLoading(true);
      setError("");
      try {
        const res = await http.get("/api/leaderboard", {
          params: { level, courseCode, limit: 50 },
        });

        const rows = Array.isArray(res.data) ? res.data : [];

        const normalized = rows.map((r, idx) => ({
          _id: r._id || `${courseCode}-${idx}`,
          studentName: r.studentName || "Unknown",
          scorePercent: Number(r.scorePercent ?? 0),
          timeSpentSeconds: Number(r.timeSpentSeconds ?? 0),
          createdAt: r.lastAttemptAt || r.createdAt || null,
        }));

        normalized.sort((a, b) => {
          if (b.scorePercent !== a.scorePercent) return b.scorePercent - a.scorePercent;
          if (a.timeSpentSeconds !== b.timeSpentSeconds) return a.timeSpentSeconds - b.timeSpentSeconds;

          const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bd - ad;
        });

        const ranked = normalized.map((x, i) => ({ ...x, rank: i + 1 }));

        if (!cancelled) setEntries(ranked);
      } catch (e) {
        if (!cancelled) {
          setEntries([]);
          setError(e?.response?.data?.message || "Failed to load leaderboard");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLeaderboard();

    socket.emit("joinLeaderboard", { level, courseCode });

    const handler = (payload) => {
      const pLevel = Number(payload?.level);
      const pCourse = String(payload?.courseCode || "").toUpperCase().trim();
      if (pLevel === level && pCourse === String(courseCode).toUpperCase().trim()) {
        fetchLeaderboard();
      }
    };

    socket.on("leaderboardUpdated", handler);

    const poll = setInterval(fetchLeaderboard, 8000);

    return () => {
      cancelled = true;
      clearInterval(poll);
      socket.off("leaderboardUpdated", handler);
      socket.emit("leaveLeaderboard", { level, courseCode });
    };
  }, [selectedCourse, activeLevel]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = entries;

    if (q) list = list.filter((e) => e.studentName.toLowerCase().includes(q));

    const sorted = [...list];

    if (sortMode === "time") {
      sorted.sort((a, b) => {
        if (a.timeSpentSeconds !== b.timeSpentSeconds) return a.timeSpentSeconds - b.timeSpentSeconds;
        return b.scorePercent - a.scorePercent;
      });
    } else {
      sorted.sort((a, b) => {
        if (b.scorePercent !== a.scorePercent) return b.scorePercent - a.scorePercent;
        return a.timeSpentSeconds - b.timeSpentSeconds;
      });
    }

    return sorted.map((r, i) => ({ ...r, viewRank: i + 1 }));
  }, [entries, search, sortMode]);

  const Controls = (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search student"
        className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-white/20 sm:w-64"
      />

      <select
        value={sortMode}
        onChange={(e) => setSortMode(e.target.value)}
        className="w-full cursor-pointer rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm outline-none focus:border-white/20 sm:w-44"
      >
        <option value="rank">Best Result</option>
        <option value="time">Fastest Time</option>
      </select>
    </div>
  );

  function handleCourseClick(c) {
    setSelectedCourse(c);
    setSearch("");
    setSortMode("rank");

    // ✅ only open modal on < lg screens
    if (!isLgUp) setMobileOpen(true);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-end">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Leaderboard</h1>
          <p className="mt-1 text-sm text-white/70">
            Top performing students per course
          </p>
        </div>

        {/* Level tabs */}
        <div className="flex w-full sm:w-auto gap-2 rounded-2xl border border-white/10 bg-white/5 p-1">
          {[100, 200].map((lv) => (
            <button
              key={lv}
              onClick={() => {
                setActiveLevel(lv);
                setMobileOpen(false);
                setSearch("");
                setSortMode("rank");
              }}
              className={`w-full sm:w-auto rounded-xl px-4 py-2 text-sm font-bold ${
                activeLevel === lv
                  ? "bg-white/10"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {lv} Level
            </button>
          ))}
        </div>
      </div>

      {/* Layout */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">
        {/* Courses */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-extrabold">Courses</div>
              <div className="text-xs text-white/60">{activeLevel} Level • 1st Semester</div>
            </div>
            <div className="text-xs text-white/60 hidden lg:block">
              {selectedCourse?.code || ""}
            </div>
          </div>

          {/* responsive grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {courses.map((c) => (
              <button
                key={c.code}
                onClick={() => handleCourseClick(c)}
                className={`rounded-2xl border p-4 text-left transition hover:bg-white/5 ${
                  selectedCourse?.code === c.code
                    ? "border-emerald-400/40 shadow-[0_0_0_3px_rgba(16,185,129,0.10)]"
                    : "border-white/10"
                }`}
              >
                <div className="font-extrabold">{c.code}</div>
                <div className="text-xs text-white/70 truncate">{c.title}</div>
                <div className="mt-3 text-xs text-white/50 lg:hidden">
                  Tap to view leaderboard
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Desktop leaderboard */}
        <div className="hidden lg:block rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-lg font-extrabold truncate">
                {selectedCourse?.code ?? "Select a course"}
              </div>
              <div className="text-xs text-white/70 truncate">
                {selectedCourse?.title ?? ""}
              </div>
            </div>

            <div className="text-xs text-white/60 shrink-0">
              {loading ? "Updating..." : error ? "Error" : "Live"}
            </div>
          </div>

          <div className="mb-4">{Controls}</div>

          {error ? (
            <div className="rounded-2xl border border-red-400/30 bg-black/15 p-4 text-sm text-white/80">
              {error}
            </div>
          ) : loading && filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-white/80">
              Loading leaderboard…
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-white/80">
              No results yet for this course.
            </div>
          ) : (
            <LeaderboardTable rows={filtered} />
          )}
        </div>
      </div>

      {/* Mobile modal leaderboard (only opens on < lg) */}
      <MobileModal
        open={mobileOpen && !isLgUp}
        onClose={() => setMobileOpen(false)}
        title={selectedCourse?.code ?? "Leaderboard"}
        subtitle={selectedCourse?.title ?? ""}
      >
        <div className="mb-2 text-xs text-white/60">
          {loading ? "Updating..." : error ? "Error" : "Live"}
        </div>

        <div className="mb-4">{Controls}</div>

        {error ? (
          <div className="rounded-2xl border border-red-400/30 bg-black/15 p-4 text-sm text-white/80">
            {error}
          </div>
        ) : loading && filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-white/80">
            Loading leaderboard…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-black/15 p-4 text-sm text-white/80">
            No results yet for this course.
          </div>
        ) : (
          <LeaderboardTable rows={filtered} />
        )}
      </MobileModal>
    </div>
  );
}
