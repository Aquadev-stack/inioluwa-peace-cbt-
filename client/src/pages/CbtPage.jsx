// client/src/pages/CbtPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { courses100_1st, courses200_1st } from "../data/courses";
import { http } from "../api/http";

function normalizeCourse(code) {
  // "GST 103" -> "GST103"
  return String(code || "").replace(/\s+/g, "").toUpperCase().trim();
}

export default function CbtPage() {
  const navigate = useNavigate();

  const [levelTab, setLevelTab] = useState("100"); // "100" | "200"
  const [semTab, setSemTab] = useState("1"); // "1" | "2"

  // Sets from DB (admin-created)
  const [sets, setSets] = useState([]);
  const [busySets, setBusySets] = useState(false);
  const [setsErr, setSetsErr] = useState("");

  const courseList = useMemo(() => {
    if (semTab !== "1") return [];
    if (levelTab === "100") return courses100_1st;
    if (levelTab === "200") return courses200_1st;
    return [];
  }, [levelTab, semTab]);

  // Load sets for this level
  useEffect(() => {
    async function loadSets() {
      setBusySets(true);
      setSetsErr("");
      try {
        const res = await http.get("/question-sets", {
          params: { level: Number(levelTab), special: "false" },
          headers: { "Cache-Control": "no-cache" },
        });
        setSets(res.data?.items || []);
      } catch (e) {
        setSets([]);
        setSetsErr(e?.response?.data?.message || "Failed to load CBT sets");
      } finally {
        setBusySets(false);
      }
    }

    if (semTab === "1") loadSets();
    else {
      setSets([]);
      setSetsErr("");
    }
  }, [levelTab, semTab]);

  // group sets by course code (normalize spaces)
  const setsByCourse = useMemo(() => {
    const map = new Map(); // courseNormalized -> sets[]
    for (const s of sets) {
      const key = normalizeCourse(s.course);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    // newest first
    for (const arr of map.values()) {
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return map;
  }, [sets]);

  function openMainExam(courseCode) {
    const level = Number(levelTab);
    const semester = Number(semTab);
    navigate(
      `/dashboard/cbt/exam/${encodeURIComponent(courseCode)}?level=${level}&semester=${semester}`
    );
  }

  function openSetExam(courseCode, setId) {
    const level = Number(levelTab);
    const semester = Number(semTab);
    // same exam page, but pass setId
    navigate(
      `/dashboard/cbt/exam/${encodeURIComponent(courseCode)}?level=${level}&semester=${semester}&setId=${encodeURIComponent(
        setId
      )}`
    );
  }

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div
        className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-6
        [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
      >
        <h2 className="text-xl font-semibold">CBT</h2>
        <p className="mt-1 text-sm text-white/70 [html[data-theme='light']_&]:text-slate-600">
          Main Exam (normal questions) + CBT Sets (admin-made).
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <TabBtn active={levelTab === "100"} onClick={() => setLevelTab("100")}>
            100 Level
          </TabBtn>
          <TabBtn active={levelTab === "200"} onClick={() => setLevelTab("200")}>
            200 Level
          </TabBtn>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <TabBtn active={semTab === "1"} onClick={() => setSemTab("1")}>
            1st Semester
          </TabBtn>
          <TabBtn active={semTab === "2"} onClick={() => setSemTab("2")}>
            2nd Semester
          </TabBtn>
        </div>

        {/* sets load status */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15">
            Sets: {busySets ? "Loading..." : sets.length}
          </span>
          {setsErr ? (
            <span className="px-2 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-200">
              {setsErr}
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="grid lg:grid-cols-3 gap-3">
        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold">
            {levelTab} Level — {semTab === "1" ? "1st Semester" : "2nd Semester"}
          </h3>
          <p className="muted mt-2 text-sm">
            Main Exam is the default. Sets appear under each course if available.
          </p>

          {semTab === "2" ? (
            <div
              className="mt-4 rounded-2xl bg-white/10 border border-white/15 p-4
              [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
            >
              <p className="text-sm muted">
                2nd semester is not available yet. We’ll upload those questions later.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {courseList.map((c) => {
                const key = normalizeCourse(c.code);
                const courseSets = setsByCourse.get(key) || [];

                return (
                  <div
                    key={c.code}
                    className="text-left rounded-2xl bg-white/10 border border-white/15 p-4
                      [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
                  >
                    <p className="font-semibold">{c.title}</p>
                    <p className="muted text-xs mt-1">Course code: {c.code}</p>

                    {/* Main Exam */}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/15">
                        Main Exam
                      </span>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/15">
                        25:00
                      </span>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 border border-white/15">
                        30 Q
                      </span>
                    </div>

                    <button
                      onClick={() => openMainExam(c.code)}
                      className="mt-3 w-full rounded-xl bg-[#0A8270]/30 border border-[#7CFF6B]/30 py-2.5 text-sm hover:bg-[#0A8270]/40 transition cursor-pointer"
                    >
                      Start Main Exam
                    </button>

                    {/* Sets */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs muted">
                          CBT Sets {courseSets.length ? `(${courseSets.length})` : ""}
                        </p>
                        {busySets ? (
                          <span className="text-[10px] muted">loading…</span>
                        ) : null}
                      </div>

                      {courseSets.length === 0 ? (
                        <div className="mt-2 rounded-xl bg-black/20 border border-white/10 p-3
                          [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200">
                          <p className="text-xs muted">No sets for this course yet.</p>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {courseSets.slice(0, 3).map((s) => (
                            <button
                              key={s._id}
                              onClick={() => openSetExam(c.code, s._id)}
                              className="w-full text-left rounded-xl bg-black/20 border border-white/10 p-3 hover:bg-black/25 transition cursor-pointer
                                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:hover:bg-slate-100"
                            >
                              <p className="text-sm font-semibold truncate">{s.title || "Untitled set"}</p>
                              <p className="text-xs muted mt-1">
                                {s.totalQuestions || 0} Q • {secToMMSS(s.durationSec || 0)}
                              </p>
                            </button>
                          ))}
                          {courseSets.length > 3 ? (
                            <p className="text-[10px] muted">+ {courseSets.length - 3} more…</p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">How it works</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="muted">• Main Exam uses the normal question pool.</li>
            <li className="muted">• CBT Sets are admin-created custom exams.</li>
            <li className="muted">• Sets can have different duration and question count.</li>
            <li className="muted">• Both open the same exam page.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* UI */

function Card({ children, className = "" }) {
  return (
    <div
      className={
        "rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-6 " +
        "[html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200 " +
        className
      }
    >
      <div className="[&_.muted]:text-white/70 [html[data-theme='light']_&]:[&_.muted]:text-slate-600">
        {children}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl border px-3 py-2 text-sm transition cursor-pointer",
        active ? "bg-[#0A8270]/30 border-[#7CFF6B]/30" : "bg-white/10 border-white/15 hover:bg-white/15",
        "[html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:hover:bg-slate-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function secToMMSS(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
