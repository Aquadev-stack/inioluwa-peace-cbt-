import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { courses100_1st, courses200_1st } from "../data/courses";
import { http } from "../api/http";

function normalizeCourse(code) {
  return String(code || "").replace(/\s+/g, "").toUpperCase().trim();
}

export default function CbtPage() {
  const navigate = useNavigate();

  // ✅ The modal determines level
  const [levelModal, setLevelModal] = useState(null); // null | "100" | "200"
  const [semTab, setSemTab] = useState("1"); // "1" | "2"

  // Sets fetched per level when modal opens
  const [sets, setSets] = useState([]);
  const [busySets, setBusySets] = useState(false);
  const [setsErr, setSetsErr] = useState("");

  const activeLevel = levelModal; // "100" or "200"

  const courseList = useMemo(() => {
    if (!activeLevel) return [];
    if (semTab !== "1") return [];
    if (activeLevel === "100") return courses100_1st;
    if (activeLevel === "200") return courses200_1st;
    return [];
  }, [activeLevel, semTab]);

  // ✅ load sets ONLY when a level modal is open
  useEffect(() => {
    let alive = true;

    async function loadSets() {
      if (!activeLevel) return;

      setBusySets(true);
      setSetsErr("");

      try {
        const res = await http.get("/question-sets", {
          params: { level: Number(activeLevel), special: "false" },
          headers: { "Cache-Control": "no-cache" },
        });

        if (!alive) return;
        setSets(res.data?.items || []);
      } catch (e) {
        if (!alive) return;
        setSets([]);
        setSetsErr(e?.response?.data?.message || "Failed to load CBT sets");
      } finally {
        if (!alive) return;
        setBusySets(false);
      }
    }

    if (activeLevel && semTab === "1") loadSets();
    else {
      setSets([]);
      setSetsErr("");
    }

    return () => {
      alive = false;
    };
  }, [activeLevel, semTab]);

  const setsByCourse = useMemo(() => {
    const map = new Map();
    for (const s of sets) {
      const key = normalizeCourse(s.course);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    return map;
  }, [sets]);

  function openMainExam(courseCode) {
    const level = Number(activeLevel);
    const semester = Number(semTab);
    navigate(
      `/dashboard/cbt/exam/${encodeURIComponent(courseCode)}?level=${level}&semester=${semester}`
    );
  }

  function openSetExam(courseCode, setId) {
    const level = Number(activeLevel);
    const semester = Number(semTab);
    navigate(
      `/dashboard/cbt/exam/${encodeURIComponent(courseCode)}?level=${level}&semester=${semester}&setId=${encodeURIComponent(
        setId
      )}`
    );
  }

  return (
    <div className="space-y-4 pb-10">
      {/* ✅ MAIN PAGE (no big list here) */}
      <div
        className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-6
        [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
      >
        <h2 className="text-xl font-semibold">CBT</h2>
        <p className="mt-1 text-sm text-white/70 [html[data-theme='light']_&]:text-slate-600">
          Select a level to open CBT in a modal.
        </p>

        {/* Semester */}
        <div className="mt-4 flex flex-wrap gap-2">
          <TabBtn active={semTab === "1"} onClick={() => setSemTab("1")}>
            1st Semester
          </TabBtn>
          <TabBtn active={semTab === "2"} onClick={() => setSemTab("2")}>
            2nd Semester
          </TabBtn>
        </div>
      </div>

      {/* Level cards */}
      <div className="grid sm:grid-cols-2 gap-3">
        <LevelCard
          title="100 Level"
          desc="Open 100 level CBT courses"
          onClick={() => setLevelModal("100")}
        />
        <LevelCard
          title="200 Level"
          desc="Open 200 level CBT courses"
          onClick={() => setLevelModal("200")}
        />
      </div>

      {/* ✅ LEVEL MODAL (contains the whole CBT container) */}
      {levelModal ? (
        <Modal
          title={`${levelModal} Level CBT`}
          onClose={() => {
            setLevelModal(null);
            setSets([]);
            setSetsErr("");
            setBusySets(false);
          }}
        >
          {/* status */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-white/10 border border-white/15">
              Sets: {busySets ? "Loading..." : sets.length}
            </span>
            {setsErr ? (
              <span className="px-2 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-200">
                {setsErr}
              </span>
            ) : null}
          </div>

          {semTab === "2" ? (
            <div className="mt-4 rounded-2xl bg-white/10 border border-white/15 p-4">
              <p className="text-sm opacity-80">
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
                    className="text-left rounded-2xl bg-white/10 border border-white/15 p-4"
                  >
                    <p className="font-semibold">{c.title}</p>
                    <p className="text-xs opacity-75 mt-1">Course code: {c.code}</p>

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
                        <p className="text-xs opacity-75">
                          CBT Sets {courseSets.length ? `(${courseSets.length})` : ""}
                        </p>
                        {busySets ? <span className="text-[10px] opacity-60">loading…</span> : null}
                      </div>

                      {courseSets.length === 0 ? (
                        <div className="mt-2 rounded-xl bg-black/20 border border-white/10 p-3">
                          <p className="text-xs opacity-75">No sets for this course yet.</p>
                        </div>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {courseSets.slice(0, 3).map((s) => (
                            <button
                              key={s._id}
                              onClick={() => openSetExam(c.code, s._id)}
                              className="w-full text-left rounded-xl bg-black/20 border border-white/10 p-3 hover:bg-black/25 transition cursor-pointer"
                            >
                              <p className="text-sm font-semibold truncate">
                                {s.title || "Untitled set"}
                              </p>
                              <p className="text-xs opacity-75 mt-1">
                                {s.totalQuestions || 0} Q • {secToMMSS(s.durationSec || 0)}
                              </p>
                            </button>
                          ))}
                          {courseSets.length > 3 ? (
                            <p className="text-[10px] opacity-60">
                              + {courseSets.length - 3} more…
                            </p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  );
}

/* UI */

function LevelCard({ title, desc, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl bg-white/10 border border-white/15 p-5
        hover:bg-white/15 transition cursor-pointer"
    >
      <p className="text-lg font-semibold">{title}</p>
      <p className="text-sm opacity-75 mt-1">{desc}</p>
      <p className="text-xs opacity-60 mt-3">Tap to open</p>
    </button>
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
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center ">
      <button
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
        aria-label="Close modal"
      />

      <div className="relative w-full sm:max-w-4xl rounded-t-2xl sm:rounded-2xl bg-[#0b1220] border border-white/10 p-5 mx-2">
        <div className="flex items-center justify-between">
          <p className="font-semibold">{title}</p>
          <button onClick={onClose} className="text-sm opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>

        {/* scroll area so modal won't overflow on mobile */}
        <div className="mt-4 max-h-[75vh] overflow-auto pr-1">
          {children}
        </div>
      </div>
    </div>
  );
}

function secToMMSS(sec) {
  const s = Math.max(0, Number(sec) || 0);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}
