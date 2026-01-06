// client/src/pages/CbtExamPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getAuth } from "../api/authStorage";
import { http } from "../api/http";

const DEFAULT_EXAM_TIME_SEC = 25 * 60;
const DEFAULT_MAX_QUESTIONS = 30;
const PASS_PERCENT = 50;

export default function CbtExamPage() {
  const { course } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const auth = getAuth();

  const level = Number(searchParams.get("level") || 100);
  const semester = Number(searchParams.get("semester") || 1);
  const setId = searchParams.get("setId") || ""; // ✅ when present -> set mode

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);

  const [timeLeft, setTimeLeft] = useState(DEFAULT_EXAM_TIME_SEC);
  const [loading, setLoading] = useState(true);

  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // set meta
  const [examMeta, setExamMeta] = useState({
    mode: "main", // "main" | "set"
    title: "",
    totalQuestions: DEFAULT_MAX_QUESTIONS,
    durationSec: DEFAULT_EXAM_TIME_SEC,
  });

  const startedAtRef = useRef(Date.now());

  // auth guard
  useEffect(() => {
    if (!auth?.token) navigate("/", { replace: true });
  }, [auth?.token, navigate]);

  // load questions (main OR set)
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        startedAtRef.current = Date.now();

        if (setId) {
          // ✅ SET MODE
          const res = await http.get(`/question-sets/${encodeURIComponent(setId)}`, {
            headers: { "Cache-Control": "no-cache" },
          });

          const item = res.data?.item;
          const q = Array.isArray(item?.questions) ? item.questions : [];

          // Normalize into your UI shape (match what your UI expects)
          const normalized = q.map((x, idx) => ({
            _id: `${item._id}-${idx + 1}`,
            question: x.question,
            options: x.options || { A: "", B: "", C: "", D: "" },
            answer: String(x.answer || "").toUpperCase().trim(), // needed for grading
            explanation: x.explanation || "",
          }));

          setExamMeta({
            mode: "set",
            title: item?.title || "CBT Set",
            totalQuestions: Number(item?.totalQuestions) || normalized.length,
            durationSec: Number(item?.durationSec) || DEFAULT_EXAM_TIME_SEC,
          });

          setQuestions(normalized);
          setCurrent(0);
          setAnswers({});
          setTimeLeft(Number(item?.durationSec) || DEFAULT_EXAM_TIME_SEC);
          setSubmitted(false);
          setShowResult(false);
          return;
        }

        // ✅ MAIN MODE (normal question pool)
        const res = await http.get("/questions", {
          params: {
            course: decodeURIComponent(course || ""),
            level,
            semester,
          },
          headers: { "Cache-Control": "no-cache" },
        });

        const items = res.data?.items || [];
        const shuffled = shuffle(items);

        const picked = shuffled.slice(0, DEFAULT_MAX_QUESTIONS);

        setExamMeta({
          mode: "main",
          title: "Main Exam",
          totalQuestions: DEFAULT_MAX_QUESTIONS,
          durationSec: DEFAULT_EXAM_TIME_SEC,
        });

        setQuestions(picked);
        setCurrent(0);
        setAnswers({});
        setTimeLeft(DEFAULT_EXAM_TIME_SEC);
        setSubmitted(false);
        setShowResult(false);
      } catch (e) {
        alert(e?.response?.data?.message || "Failed to load exam");
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [course, level, semester, setId]);

  // timer
  useEffect(() => {
    if (loading) return;
    if (submitted) return;

    if (timeLeft <= 0) {
      doSubmit(true);
      return;
    }

    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft, loading, submitted]);

  const total = questions.length;
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const progress = useMemo(() => {
    if (!total) return 0;
    return Math.round((answeredCount / total) * 100);
  }, [answeredCount, total]);

  const currentQ = questions[current];

  function pickAnswer(qid, letter) {
    setAnswers((p) => ({ ...p, [qid]: letter }));
  }

  function goPrev() {
    setCurrent((i) => Math.max(0, i - 1));
  }
  function goNext() {
    setCurrent((i) => Math.min(total - 1, i + 1));
  }
  function jumpTo(i) {
    setCurrent(i);
  }

  function endExam() {
    setShowEndConfirm(true);
  }
  function submitClick() {
    setShowSubmitConfirm(true);
  }

  function doSubmit() {
    if (submitted) return;
    setSubmitted(true);
    setShowEndConfirm(false);
    setShowSubmitConfirm(false);
    setShowResult(true);
  }

  const result = useMemo(() => {
    if (!submitted || !questions.length) return null;

    let correct = 0;
    const wrongList = [];

    for (const q of questions) {
      const qid = q._id;
      const chosen = answers[qid] || null;

      const correctLetter = String(q.answer || "").toUpperCase().trim();
      const ok = chosen && correctLetter && chosen === correctLetter;

      if (ok) correct++;
      else {
        wrongList.push({
          id: qid,
          question: q.question,
          options: q.options || { A: "", B: "", C: "", D: "" },
          chosen,
          correct: correctLetter,
          explanation: q.explanation || "",
        });
      }
    }

    const percent = Math.round((correct / questions.length) * 100);
    const passed = percent >= PASS_PERCENT;

    // time spent (useful for leaderboard later if you want)
    const timeSpentSeconds = Math.max(
      0,
      Math.round((Date.now() - startedAtRef.current) / 1000)
    );

    return { correct, total: questions.length, percent, passed, wrongList, timeSpentSeconds };
  }, [submitted, questions, answers]);

  function closeResult() {
    setShowResult(false);
    navigate("/dashboard/cbt");
  }

  if (loading) return <p className="text-sm text-white/70">Loading exam...</p>;

  if (!questions.length) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-white/70">
          No questions found for <b>{decodeURIComponent(course || "")}</b>.
        </p>
        <p className="text-xs text-white/60">
          If this is a SET: confirm the set has questions and isActive true.
        </p>
      </div>
    );
  }

  const qid = currentQ?._id;
  const opts = currentQ?.options || { A: "", B: "", C: "", D: "" };
  const chosen = answers[qid] || "";

  const headerSubtitle =
    examMeta.mode === "set"
      ? `${level} Level • ${examMeta.title} • ${total} Questions • Pass mark ${PASS_PERCENT}%`
      : `${level} Level • Semester ${semester} • ${DEFAULT_MAX_QUESTIONS} Questions • Pass mark ${PASS_PERCENT}%`;

  return (
    <div className="space-y-4 pb-10">
      {/* Header */}
      <div
        className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-5
        [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs text-white/70 [html[data-theme='light']_&]:text-slate-600">
              {headerSubtitle}
            </p>
            <h2 className="text-xl font-semibold mt-1">
              {decodeURIComponent(course || "")} CBT Exam
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <TimerPill timeLeft={timeLeft} />
            <button
              onClick={endExam}
              className="rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm hover:bg-white/15 transition cursor-pointer
                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
            >
              End Exam
            </button>
            <button
              onClick={submitClick}
              className="rounded-xl bg-[#0A8270]/35 border border-[#7CFF6B]/35 px-3 py-2 text-sm hover:bg-[#0A8270]/45 transition cursor-pointer"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/70 [html[data-theme='light']_&]:text-slate-600">
            <span>Answered: {answeredCount}/{total}</span>
            <span>Progress: {progress}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-black/20 border border-white/10 overflow-hidden
              [html[data-theme='light']_&]:bg-slate-100 [html[data-theme='light']_&]:border-slate-200">
            <div className="h-full bg-[#7CFF6B]/40" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="grid lg:grid-cols-12 gap-3">
        {/* Question */}
        <div className="lg:col-span-8">
          <div
            className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-6
            [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-white/70 [html[data-theme='light']_&]:text-slate-600">
                Question {current + 1} of {total}
              </p>

              <span className="text-xs px-2 py-1 rounded-full border border-white/15 bg-black/20
                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200">
                {chosen ? `Selected: ${chosen}` : "Not answered"}
              </span>
            </div>

            <h3 className="text-lg font-semibold mt-3 leading-snug">
              {currentQ.question}
            </h3>

            <div className="mt-4 grid sm:grid-cols-2 gap-3">
              {(["A", "B", "C", "D"]).map((k) => (
                <OptionCard
                  key={k}
                  label={k}
                  text={opts[k] || ""}
                  active={chosen === k}
                  onClick={() => pickAnswer(qid, k)}
                />
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between gap-2">
              <button
                onClick={goPrev}
                disabled={current === 0}
                className="rounded-xl bg-white/10 border border-white/15 px-4 py-2 text-sm hover:bg-white/15 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
                  [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
              >
                Previous
              </button>

              <button
                onClick={goNext}
                disabled={current === total - 1}
                className="rounded-xl bg-white/10 border border-white/15 px-4 py-2 text-sm hover:bg-white/15 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed
                  [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Navigator */}
        <div className="lg:col-span-4 space-y-3">
          <div
            className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-5
            [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
          >
            <h4 className="font-semibold">Question Navigator</h4>
            <p className="text-xs text-white/70 [html[data-theme='light']_&]:text-slate-600 mt-1">
              Tap a number to jump.
            </p>

            <div className="mt-4 grid grid-cols-6 gap-2">
              {questions.map((q, idx) => {
                const id = q._id;
                const isAnswered = !!answers[id];
                const isActive = idx === current;

                return (
                  <button
                    key={id}
                    onClick={() => jumpTo(idx)}
                    className={[
                      "h-10 rounded-xl text-xs font-semibold border transition cursor-pointer",
                      isActive
                        ? "bg-[#0A8270]/35 border-[#7CFF6B]/35"
                        : isAnswered
                        ? "bg-[#7CFF6B]/15 border-[#7CFF6B]/35 text-[#7CFF6B]"
                        : "bg-white/10 border-white/15 hover:bg-white/15",
                      "[html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200",
                    ].join(" ")}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={submitClick}
                className="flex-1 rounded-xl bg-[#0A8270]/35 border border-[#7CFF6B]/35 py-2.5 text-sm hover:bg-[#0A8270]/45 transition cursor-pointer"
              >
                Submit
              </button>
              <button
                onClick={endExam}
                className="rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm hover:bg-white/15 transition cursor-pointer
                  [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
              >
                End
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEndConfirm && (
        <SimpleConfirm
          title="End exam now?"
          subtitle="This will submit whatever you have answered so far."
          onClose={() => setShowEndConfirm(false)}
          onConfirm={doSubmit}
          confirmText="End & Submit"
        />
      )}

      {showSubmitConfirm && (
        <SimpleConfirm
          title="Submit exam?"
          subtitle={`You answered ${answeredCount} out of ${total}.`}
          onClose={() => setShowSubmitConfirm(false)}
          onConfirm={doSubmit}
          confirmText="Submit"
        />
      )}

      {showResult && result && (
        <ResultModal
          open={showResult}
          course={decodeURIComponent(course || "")}
          result={result}
          onClose={closeResult}
        />
      )}
    </div>
  );
}

/* UI helpers */

function TimerPill({ timeLeft }) {
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const danger = timeLeft <= 60;

  return (
    <div
      className={[
        "rounded-xl px-3 py-2 border font-mono text-sm min-w-[90px] text-center",
        danger ? "bg-red-500/15 border-red-500/30 text-red-100" : "bg-black/20 border-white/15",
        "[html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:text-slate-900",
      ].join(" ")}
    >
      {mm}:{ss}
    </div>
  );
}

function OptionCard({ label, text, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "text-left rounded-2xl border p-4 transition cursor-pointer",
        active ? "bg-[#0A8270]/35 border-[#7CFF6B]/35" : "bg-white/10 border-white/15 hover:bg-white/15",
        "[html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:hover:bg-slate-50",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-xl bg-black/20 border border-white/10 flex items-center justify-center font-semibold
          [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200">
          {label}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug">{text || "—"}</p>
        </div>
      </div>
    </button>
  );
}

function SimpleConfirm({ title, subtitle, onClose, onConfirm, confirmText }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-950/90 border border-white/15 backdrop-blur p-5
        [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-white/70 [html[data-theme='light']_&]:text-slate-600 mt-2">{subtitle}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 border border-white/15 px-4 py-2 text-sm hover:bg-white/15 transition cursor-pointer
              [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl bg-[#0A8270]/35 border border-[#7CFF6B]/35 px-4 py-2 text-sm hover:bg-[#0A8270]/45 transition cursor-pointer"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultModal({ open, course, result, onClose }) {
  if (!open || !result) return null;

  const { correct, total, percent, passed, wrongList } = result;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-950/90 border border-white/15 backdrop-blur p-6
        [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <p className="text-xs text-white/70 [html[data-theme='light']_&]:text-slate-600">{course} • Result</p>
            <h3 className="text-xl font-semibold mt-1">{passed ? "✅ PASS" : "❌ FAIL"} — {percent}%</h3>
          </div>
          <div className="text-sm text-white/70 [html[data-theme='light']_&]:text-slate-600">
            Correct: <b className="text-white [html[data-theme='light']_&]:text-slate-900">{correct}</b> / {total}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/15 bg-white/5 p-4
          [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200">
          <p className="text-sm text-white/80 [html[data-theme='light']_&]:text-slate-700">
            Corrections (questions you missed):
          </p>

          {wrongList.length === 0 ? (
            <p className="text-sm mt-2 text-[#7CFF6B]">Perfect score.</p>
          ) : (
            <div className="mt-3 space-y-3 max-h-[50vh] overflow-auto pr-1">
              {wrongList.map((w, idx) => (
                <div
                  key={w.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4
                    [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
                >
                  <p className="text-sm font-semibold">{idx + 1}. {w.question}</p>

                  <div className="mt-2 grid sm:grid-cols-2 gap-2 text-sm">
                    {["A", "B", "C", "D"].map((k) => (
                      <div
                        key={k}
                        className={[
                          "rounded-xl border p-3",
                          k === w.correct
                            ? "bg-[#7CFF6B]/15 border-[#7CFF6B]/35 text-[#7CFF6B]"
                            : k === w.chosen
                            ? "bg-red-500/15 border-red-500/30 text-red-100"
                            : "bg-white/5 border-white/10 text-white/80",
                          "[html[data-theme='light']_&]:text-slate-800",
                        ].join(" ")}
                      >
                        <b>{k}.</b> {w.options?.[k] || "—"}
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-xs text-white/70 [html[data-theme='light']_&]:text-slate-600">
                    Your answer: <b>{w.chosen || "None"}</b> • Correct: <b>{w.correct}</b>
                  </p>

                  {w.explanation ? (
                    <p className="mt-2 text-sm text-white/80 [html[data-theme='light']_&]:text-slate-700">
                      Explanation: {w.explanation}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#0A8270]/35 border border-[#7CFF6B]/35 px-4 py-2 text-sm hover:bg-[#0A8270]/45 transition cursor-pointer"
          >
            Back to CBT List
          </button>
        </div>
      </div>
    </div>
  );
}

function shuffle(arr) {
  return [...(arr || [])].sort(() => Math.random() - 0.5);
}
