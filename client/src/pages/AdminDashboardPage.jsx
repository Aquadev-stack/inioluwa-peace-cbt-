// client/src/pages/AdminDashboardPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, clearAuth } from "../api/authStorage";
import { http } from "../api/http";
import logo from "../assets/logo.png";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth?.user;

  useEffect(() => {
    if (!auth?.token) navigate("/", { replace: true });
    if (user?.role !== "admin") navigate("/dashboard", { replace: true });
  }, [auth?.token, user?.role, navigate]);

  const [tab, setTab] = useState("overview"); // overview | pdfs | sets

  // reports lite for counts only (inbox page handles full actions)
  const [reports, setReports] = useState([]);
  const [topErr, setTopErr] = useState("");

  async function loadReportsLite() {
    setTopErr("");
    try {
      const res = await http.get("/api/reports");
      setReports(res.data?.reports || []);
    } catch (e) {
      // keep UI stable if route isn't ready
      setReports([]);
    }
  }

  useEffect(() => {
    if (user?.role === "admin") loadReportsLite();
    const t = setInterval(() => {
      if (user?.role === "admin") loadReportsLite();
    }, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const totalReports = reports.length;
  const unreadCount = useMemo(
    () => reports.filter((r) => r.status === "unread").length,
    [reports]
  );

  function logout() {
    clearAuth();
    navigate("/", { replace: true });
  }

  return (
    <div className="space-y-4 pt-2 pb-10">
      <TopBar
        user={user}
        totalReports={totalReports}
        unreadCount={unreadCount}
        onInbox={() => navigate("/dashboard/admin/inbox")}
        logout={logout}
      />

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>
          Overview
        </TabBtn>
        <TabBtn active={tab === "pdfs"} onClick={() => setTab("pdfs")}>
          PDF Uploads
        </TabBtn>
        <TabBtn active={tab === "sets"} onClick={() => setTab("sets")}>
          CBT Sets
        </TabBtn>
      </div>

      {topErr && <Notice type="err" text={topErr} />}

      {tab === "overview" && (
        <Overview totalReports={totalReports} unreadCount={unreadCount} />
      )}

      {tab === "pdfs" && <PdfUploadOnly />}

      {tab === "sets" && <QuestionSetBuilder />}
    </div>
  );
}

/* ===================== TOP ===================== */

function TopBar({ user, totalReports, unreadCount, onInbox, logout }) {
  return (
    <div
      className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-5
      [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden">
            <img
              src={logo}
              alt="INIOLUWA PEACE CBT"
              className="h-10 w-10 object-contain"
            />
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-semibold truncate">
              Admin Dashboard{user?.name ? `: ${user.name}` : ""}
            </h2>
            <p className="text-sm text-white/70 [html[data-theme='light']_&]:text-slate-600 mt-1">
              PDFs • CBT Question Sets • Reports
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onInbox}
            className="relative rounded-xl bg-black/20 border border-white/10 px-3 py-2 text-sm hover:bg-black/25 transition cursor-pointer
              [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
            title="Inbox"
          >
            <span className="font-medium">Inbox</span>
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center justify-center text-[10px] px-2 py-0.5 rounded-full bg-[#7CFF6B]/15 border border-[#7CFF6B]/40 text-[#7CFF6B]">
                {unreadCount} new
              </span>
            )}
          </button>

          <button
            onClick={logout}
            className="rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 px-3 py-2 text-sm font-medium hover:bg-red-500/20 transition cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mt-4 grid sm:grid-cols-3 gap-3">
        <Stat title="Role" value="admin" />
        <Stat title="Total reports" value={String(totalReports)} />
        <Stat title="Unread" value={String(unreadCount)} />
      </div>
    </div>
  );
}

/* ===================== OVERVIEW (IMPROVED) ===================== */

function Overview({ totalReports, unreadCount }) {
  const attention =
    unreadCount > 0
      ? {
          title: "Inbox needs attention",
          desc: `You have ${unreadCount} unread report(s).`,
          pill: "ACTION",
          pillClass:
            "bg-[#EFBF04]/15 border border-[#EFBF04]/35 text-[#EFBF04]",
        }
      : {
          title: "Inbox is clear",
          desc: "No unread reports right now.",
          pill: "CLEAR",
          pillClass:
            "bg-[#7CFF6B]/15 border border-[#7CFF6B]/40 text-[#7CFF6B]",
        };

  return (
    <div className="space-y-3">
      {/* HERO STRIP */}
      <div
        className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-6
        [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold truncate">Admin Overview</h3>
            <p className="muted mt-1 text-sm">
              Manage PDFs, build CBT Sets, and respond to student reports — all
              in one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Chip label={`Total Reports: ${totalReports}`} />
            <Chip
              label={`Unread: ${unreadCount}`}
              tone={unreadCount > 0 ? "warn" : "ok"}
            />
            <Chip label="Default: 15:00" />
            <Chip label="Max: 40:00" />
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <MiniStat title="Reports" value={String(totalReports)} hint="All time" />
          <MiniStat
            title="Unread"
            value={String(unreadCount)}
            hint={unreadCount > 0 ? "Respond quickly" : "All clear"}
            tone={unreadCount > 0 ? "warn" : "ok"}
          />
          <MiniStat title="CBT Default Time" value="15:00" hint="Recommended" />
          <MiniStat title="CBT Max Time" value="40:00" hint="Hard limit" />
        </div>
      </div>

      {/* GRID */}
      <div className="grid lg:grid-cols-3 gap-3">
        {/* Today Tasks */}
        <Card>
          <h3 className="text-lg font-semibold">Today’s Admin Tasks</h3>
          <p className="muted mt-2 text-sm">
            A clean workflow keeps the CBT platform stable.
          </p>

          <div className="mt-4 space-y-2">
            <TaskRow done={false} text="Upload PDFs for 100lv and 200lv." />
            <TaskRow done={false} text="Mark NEW for fresh uploads (optional)." />
            <TaskRow done={false} text="Create a CBT Set (e.g. 50 questions)." />
            <TaskRow done={false} text={`Review Inbox (${unreadCount} unread).`} />
          </div>

          <div
            className="mt-4 rounded-2xl bg-black/20 border border-white/10 p-4
            [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
          >
            <p className="font-semibold">Quality rules</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li className="muted">
                • Use clear titles: “MTH101 Past Questions 2022”.
              </li>
              <li className="muted">
                • Course code must match what students search.
              </li>
              <li className="muted">• For CBT sets, keep time ≤ 40:00.</li>
            </ul>
          </div>
        </Card>

        {/* Inbox / Attention */}
        <Card>
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-lg font-semibold">Reports & Inbox</h3>
              <p className="muted mt-2 text-sm">
                Students will report issues here — keep it monitored.
              </p>
            </div>

            <span className={`text-[10px] px-2 py-1 rounded-full ${attention.pillClass}`}>
              {attention.pill}
            </span>
          </div>

          <div
            className="mt-4 rounded-2xl bg-white/10 border border-white/15 p-4
            [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
          >
            <p className="font-semibold">{attention.title}</p>
            <p className="muted mt-2 text-sm">{attention.desc}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <SmallInfo title="Total reports" value={String(totalReports)} />
            <SmallInfo title="Unread reports" value={String(unreadCount)} />
          </div>

          <div className="mt-4 rounded-2xl bg-[#0A8270]/15 border border-[#7CFF6B]/25 p-4">
            <p className="font-semibold">Response tip</p>
            <p className="muted mt-2 text-sm">
              If a student says “CBT not starting” or “PDF not opening”, ask for:
              course code, level, and screenshot of the error.
            </p>
          </div>
        </Card>

        {/* Guidelines */}
        <Card>
          <h3 className="text-lg font-semibold">Admin Guidelines</h3>
          <p className="muted mt-2 text-sm">
            Keep content consistent and easy to find.
          </p>

          <div className="mt-4 space-y-3">
            <Guideline
              title="PDF Naming Standard"
              body="Use: COURSECODE + type + year/topic. Example: “CSC101 Lecture Notes Week 3”."
              tag="STANDARD"
            />
            <Guideline
              title="CBT Set Naming"
              body="Use: COURSECODE + purpose. Example: “MTH101 Special Set – Past Questions”."
              tag="BEST PRACTICE"
            />
            <Guideline
              title="Time Rules"
              body="Default is 15:00. Maximum allowed is 40:00 (do not exceed)."
              tag="RULE"
            />
          </div>

          <div
            className="mt-4 rounded-2xl bg-black/20 border border-white/10 p-4
            [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
          >
            <p className="font-semibold">System checklist</p>
            <div className="mt-3 space-y-2 text-sm">
              <Check ok label="Backend running (server OK)" />
              <Check ok label="MongoDB connected" />
              <Check ok label="Uploads folder mounted" />
              <Check ok label="Admin session valid" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ===================== PDF UPLOAD + LIST + DELETE ===================== */

function PdfUploadOnly() {
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    course: "",
    level: 100,
    isNew: true,
  });

  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // list state
  const [items, setItems] = useState([]);
  const [listBusy, setListBusy] = useState(false);
  const [q, setQ] = useState("");
  const [levelFilter, setLevelFilter] = useState(""); // "" | "100" | "200"

  function onChange(e) {
    setErr("");
    setOk("");
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === "level" ? Number(value) : value }));
  }

  function pickFile(f) {
    setErr("");
    setOk("");
    setFile(f || null);
  }

  async function loadPdfs() {
    setListBusy(true);
    try {
      const res = await http.get("/api/pdfs", {
        params: {
          q: q.trim() || undefined,
          level: levelFilter || undefined,
        },
        headers: { "Cache-Control": "no-cache" },
      });

      setItems(res.data?.items || []);
    } catch (e) {
      setItems([]);
    } finally {
      setListBusy(false);
    }
  }

  useEffect(() => {
    loadPdfs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload() {
    setErr("");
    setOk("");

    if (!form.title.trim()) return setErr("Title is required");
    if (!form.course.trim()) return setErr("Course code is required (e.g. MTH101)");
    if (!file) return setErr("Choose a PDF file");

    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", form.title.trim());
      fd.append("course", form.course.trim().toUpperCase());
      fd.append("level", String(form.level));
      fd.append("isNew", String(!!form.isNew));

      await http.post("/pdfs", fd);

      setOk("PDF uploaded ✅");
      setForm({ title: "", course: "", level: form.level, isNew: true });
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";

      await loadPdfs();
    } catch (e) {
      setErr(e?.response?.data?.message || "Upload failed (server error)");
    } finally {
      setBusy(false);
    }
  }

  async function delPdf(id) {
    const sure = window.confirm("Delete this PDF permanently?");
    if (!sure) return;

    setErr("");
    setOk("");
    try {
      await http.delete(`/api/pdfs/${id}`);
      setOk("PDF deleted ✅");
      await loadPdfs();
    } catch (e) {
      setErr(e?.response?.data?.message || "Delete failed (server error)");
    }
  }

  return (
    <div className="grid lg:grid-cols-5 gap-3">
      {/* UPLOAD */}
      <Card className="lg:col-span-3">
        <h3 className="text-lg font-semibold">Upload PDF</h3>
        <p className="muted mt-2 text-sm">
          Upload PDFs and manage them (open/delete) from the list.
        </p>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <Field label="Title">
            <input
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="e.g. MTH101 Past Questions"
              className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none
                focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20
                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
            />
          </Field>

          <Field label="Course Code">
            <input
              name="course"
              value={form.course}
              onChange={onChange}
              placeholder="e.g. MTH101"
              className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none uppercase
                focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20
                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
            />
          </Field>

          <Field label="Level">
            <select
              name="level"
              value={form.level}
              onChange={onChange}
              className="mt-2 w-full rounded-xl bg-slate-900 text-white border border-white/15 px-3 py-2 text-sm outline-none cursor-pointer
                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:text-slate-900 [html[data-theme='light']_&]:border-slate-200"
            >
              <option value={100}>100lv</option>
              <option value={200}>200lv</option>
            </select>
          </Field>

          <Field label="Tag">
            <label
              className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm flex items-center gap-2 cursor-pointer
              [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
            >
              <input
                type="checkbox"
                checked={!!form.isNew}
                onChange={(e) => setForm((p) => ({ ...p, isNew: e.target.checked }))}
              />
              <span className="muted">Mark as NEW</span>
            </label>
          </Field>

          <div className="sm:col-span-2">
            <Field label="PDF File">
              <div
                onClick={() => fileRef.current?.click()}
                className="mt-2 rounded-2xl border border-dashed border-white/25 bg-black/20 p-4 cursor-pointer hover:bg-black/25 transition
                  [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-300"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => pickFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <p className="text-sm font-medium">{file ? file.name : "Click to choose PDF"}</p>
                <p className="text-xs muted mt-1">PDF only</p>
              </div>
            </Field>
          </div>

          <div className="sm:col-span-2">
            <button
              onClick={upload}
              disabled={busy}
              className="w-full rounded-xl bg-[#EFBF04] text-slate-900 font-semibold py-2.5 hover:brightness-110 transition cursor-pointer disabled:opacity-70"
            >
              {busy ? "Uploading..." : "Upload PDF"}
            </button>
          </div>
        </div>

        {err && <Notice type="err" text={err} />}
        {ok && <Notice type="ok" text={ok} />}
      </Card>

      {/* LIST */}
      <Card className="lg:col-span-2">
        <div className="flex items-end justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">All PDF Uploads</h3>
            <p className="muted mt-1 text-sm">Open or delete PDFs you don’t need.</p>
          </div>
          <button
            onClick={loadPdfs}
            className="rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm hover:bg-white/15 transition cursor-pointer
              [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
          >
            Refresh
          </button>
        </div>

        <div className="mt-3 grid gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or course..."
            className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none
              [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
          />

          <div className="flex gap-2">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full rounded-xl bg-slate-900 text-white border border-white/15 px-3 py-2 text-sm outline-none cursor-pointer
                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:text-slate-900 [html[data-theme='light']_&]:border-slate-200"
            >
              <option value="">All levels</option>
              <option value="100">100lv</option>
              <option value="200">200lv</option>
            </select>

            <button
              onClick={loadPdfs}
              className="rounded-xl bg-[#0A8270]/25 border border-[#7CFF6B]/25 px-4 py-2 text-sm hover:bg-[#0A8270]/35 transition cursor-pointer"
            >
              Search
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-2 max-h-[55vh] overflow-auto pr-1">
          {listBusy ? (
            <p className="muted text-sm">Loading...</p>
          ) : items.length === 0 ? (
            <p className="muted text-sm">No PDFs yet.</p>
          ) : (
            items.map((p) => (
              <div
                key={p._id}
                className="rounded-2xl bg-black/20 border border-white/10 p-3
                  [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.title}</p>
                    <p className="text-xs muted mt-1">
                      {p.course} • {p.level}lv {p.isNew ? "• NEW" : ""} •{" "}
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <a
                      href={p.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-xl bg-white/10 border border-white/15 px-3 py-1.5 text-xs hover:bg-white/15 transition
                        [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
                    >
                      Open
                    </a>
                    <button
                      onClick={() => delPdf(p._id)}
                      className="rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 px-3 py-1.5 text-xs hover:bg-red-500/20 transition cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

/* ===================== CBT SET BUILDER ===================== */

function QuestionSetBuilder() {
  const [meta, setMeta] = useState({
    course: "",
    level: 100,
    title: "",
    totalQuestions: 50,
    minutes: 15, // max 40
    isSpecial: true,
  });

  const [questions, setQuestions] = useState(() => makeEmptyQuestions(50));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  function onMetaChange(e) {
    setErr("");
    setOk("");
    const { name, value, type, checked } = e.target;

    setMeta((p) => {
      const next = { ...p, [name]: type === "checkbox" ? checked : value };
      if (name === "level" || name === "totalQuestions" || name === "minutes") {
        next[name] = Number(value);
      }
      return next;
    });
  }

  function applyTotalQuestions() {
    setErr("");
    setOk("");

    const n = Number(meta.totalQuestions);
    if (!n || n < 1 || n > 200) return setErr("Total questions must be between 1 and 200");

    setQuestions((prev) => {
      const current = Array.isArray(prev) ? prev : [];
      if (current.length === n) return current;

      if (current.length > n) return current.slice(0, n);
      const more = Array.from({ length: n - current.length }).map(() => emptyOne());
      return [...current, ...more];
    });
  }

  function updateQ(i, patch) {
    setErr("");
    setOk("");
    setQuestions((arr) => {
      const copy = [...arr];
      copy[i] = { ...copy[i], ...patch };
      return copy;
    });
  }

  function updateOpt(i, key, value) {
    setErr("");
    setOk("");
    setQuestions((arr) => {
      const copy = [...arr];
      copy[i] = { ...copy[i], options: { ...copy[i].options, [key]: value } };
      return copy;
    });
  }

  function resetAll() {
    setMeta({
      course: "",
      level: 100,
      title: "",
      totalQuestions: 50,
      minutes: 15,
      isSpecial: true,
    });
    setQuestions(makeEmptyQuestions(50));
  }

  async function saveSet() {
    setErr("");
    setOk("");

    if (!meta.course.trim()) return setErr("Course code is required (e.g. MTH101)");
    if (!meta.title.trim()) return setErr("Set title is required (e.g. Past Questions 2022)");

    const mins = Number(meta.minutes);
    if (!mins || mins < 1) return setErr("Duration must be at least 1 minute");
    if (mins > 40) return setErr("Maximum time allowed is 40:00");

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) return setErr(`Q${i + 1}: question text is empty`);
      if (!q.options.A.trim() || !q.options.B.trim() || !q.options.C.trim() || !q.options.D.trim()) {
        return setErr(`Q${i + 1}: options A-D must be filled`);
      }
      if (!["A", "B", "C", "D"].includes(q.answer)) return setErr(`Q${i + 1}: pick a correct answer`);
    }

    setBusy(true);
    try {
      const payload = {
        course: meta.course.trim().toUpperCase(),
        level: Number(meta.level),
        title: meta.title.trim(),
        totalQuestions: Number(meta.totalQuestions),
        durationSec: mins * 60,
        isSpecial: !!meta.isSpecial,
        questions: questions.map((q, idx) => ({
          number: idx + 1,
          question: q.question.trim(),
          options: {
            A: q.options.A.trim(),
            B: q.options.B.trim(),
            C: q.options.C.trim(),
            D: q.options.D.trim(),
          },
          answer: q.answer,
          explanation: q.explanation.trim(),
        })),
      };

      await http.post("/question-sets", payload);

      setOk("CBT Set saved ✅");
      resetAll();
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to save set (server error)");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid lg:grid-cols-5 gap-3">
        <Card className="lg:col-span-3">
          <h3 className="text-lg font-semibold">Create CBT Question Set</h3>
          <p className="muted mt-2 text-sm">Upload Q1..Q{questions.length}. Max time is 40:00.</p>

          <div className="mt-4 grid sm:grid-cols-2 gap-3">
            <Field label="Course Code">
              <input
                name="course"
                value={meta.course}
                onChange={onMetaChange}
                placeholder="e.g. MTH101"
                className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none uppercase
                  focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20
                  [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
              />
            </Field>

            <Field label="Level">
              <select
                name="level"
                value={meta.level}
                onChange={onMetaChange}
                className="mt-2 w-full rounded-xl bg-slate-900 text-white border border-white/15 px-3 py-2 text-sm outline-none cursor-pointer
                  [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:text-slate-900 [html[data-theme='light']_&]:border-slate-200"
              >
                <option value={100}>100lv</option>
                <option value={200}>200lv</option>
              </select>
            </Field>

            <div className="sm:col-span-2">
              <Field label="Set Title">
                <input
                  name="title"
                  value={meta.title}
                  onChange={onMetaChange}
                  placeholder="e.g. Past Questions 2022 / Revision Pack"
                  className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none
                    focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20
                    [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
                />
              </Field>
            </div>

            <Field label="Number of Questions">
              <div className="mt-2 flex gap-2">
                <input
                  name="totalQuestions"
                  type="number"
                  min={1}
                  max={200}
                  value={meta.totalQuestions}
                  onChange={onMetaChange}
                  className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none
                    [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
                />
                <button
                  onClick={applyTotalQuestions}
                  className="rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm hover:bg-white/15 transition cursor-pointer
                    [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
                >
                  Apply
                </button>
              </div>
            </Field>

            <Field label="Duration (minutes) — max 40">
              <input
                name="minutes"
                type="number"
                min={1}
                max={40}
                value={meta.minutes}
                onChange={onMetaChange}
                className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none
                  [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
              />
            </Field>

            <div className="sm:col-span-2">
              <label
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm cursor-pointer
                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
              >
                <input type="checkbox" name="isSpecial" checked={!!meta.isSpecial} onChange={onMetaChange} />
                <span className="muted">Mark as SPECIAL (shows in CBT Special Sets)</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={saveSet}
              disabled={busy}
              className="flex-1 rounded-xl bg-[#0A8270]/30 border border-[#7CFF6B]/30 py-2.5 text-sm hover:bg-[#0A8270]/40 transition cursor-pointer disabled:opacity-70"
            >
              {busy ? "Saving..." : "Save CBT Set"}
            </button>

            <button
              onClick={() => {
                setErr("");
                setOk("");
                resetAll();
              }}
              className="rounded-xl bg-white/10 border border-white/15 px-4 py-2.5 text-sm hover:bg-white/15 transition cursor-pointer
                [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
            >
              Clear
            </button>
          </div>

          {err && <Notice type="err" text={err} />}
          {ok && <Notice type="ok" text={ok} />}
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold">Fast Workflow Tips</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="muted">• Set questions count → Apply → fill Q1..Q50.</li>
            <li className="muted">• Keep duration max at 40 minutes.</li>
            <li className="muted">• Save clears the form after success.</li>
          </ul>
        </Card>
      </div>

      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-5
              [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">Question {idx + 1}</p>
              <span className="text-xs muted">
                Answer: <b>{q.answer}</b>
              </span>
            </div>

            <textarea
              value={q.question}
              onChange={(e) => updateQ(idx, { question: e.target.value })}
              rows={3}
              placeholder={`Type Q${idx + 1}...`}
              className="mt-3 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none resize-none
                focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20
                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
            />

            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <Opt label="Option A" value={q.options.A} onChange={(v) => updateOpt(idx, "A", v)} />
              <Opt label="Option B" value={q.options.B} onChange={(v) => updateOpt(idx, "B", v)} />
              <Opt label="Option C" value={q.options.C} onChange={(v) => updateOpt(idx, "C", v)} />
              <Opt label="Option D" value={q.options.D} onChange={(v) => updateOpt(idx, "D", v)} />
            </div>

            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <Field label="Correct Answer">
                <select
                  value={q.answer}
                  onChange={(e) => updateQ(idx, { answer: e.target.value })}
                  className="mt-2 w-full rounded-xl bg-slate-900 text-white border border-white/15 px-3 py-2 text-sm outline-none cursor-pointer
                    [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:text-slate-900 [html[data-theme='light']_&]:border-slate-200"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </Field>

              <Field label="Explanation (optional)">
                <input
                  value={q.explanation}
                  onChange={(e) => updateQ(idx, { explanation: e.target.value })}
                  placeholder="Short note for review mode..."
                  className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none
                    [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
                />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Opt({ label, value, onChange }) {
  return (
    <div>
      <p className="text-xs muted mb-2">{label}</p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none
          [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
      />
    </div>
  );
}

function makeEmptyQuestions(n) {
  return Array.from({ length: Number(n) || 1 }).map(() => emptyOne());
}

function emptyOne() {
  return {
    question: "",
    options: { A: "", B: "", C: "", D: "" },
    answer: "A",
    explanation: "",
  };
}

/* ===================== OVERVIEW UI BITS ===================== */

function Chip({ label, tone = "neutral" }) {
  const cls =
    tone === "warn"
      ? "bg-[#EFBF04]/15 border-[#EFBF04]/35 text-[#EFBF04]"
      : tone === "ok"
      ? "bg-[#7CFF6B]/15 border-[#7CFF6B]/40 text-[#7CFF6B]"
      : "bg-white/10 border-white/15 text-white/80 [html[data-theme='light']_&]:text-slate-700";

  return (
    <span className={["text-[10px] px-2 py-1 rounded-full border", cls].join(" ")}>
      {label}
    </span>
  );
}

function MiniStat({ title, value, hint, tone = "neutral" }) {
  const ring =
    tone === "warn"
      ? "border-[#EFBF04]/25"
      : tone === "ok"
      ? "border-[#7CFF6B]/25"
      : "border-white/15";

  return (
    <div
      className={[
        "rounded-2xl bg-black/20 border p-4",
        ring,
        "[html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200",
      ].join(" ")}
    >
      <p className="text-xs muted">{title}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
      <p className="text-xs muted mt-1">{hint}</p>
    </div>
  );
}

function TaskRow({ done, text }) {
  return (
    <div
      className="flex items-start gap-2 rounded-xl bg-white/10 border border-white/15 px-3 py-2
      [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
    >
      <span
        className={[
          "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px]",
          done
            ? "bg-[#7CFF6B]/15 border-[#7CFF6B]/40 text-[#7CFF6B]"
            : "bg-black/20 border-white/15 text-white/70 [html[data-theme='light']_&]:text-slate-600",
        ].join(" ")}
      >
        {done ? "✓" : "•"}
      </span>
      <p className="text-sm">{text}</p>
    </div>
  );
}

function SmallInfo({ title, value }) {
  return (
    <div
      className="rounded-2xl bg-black/20 border border-white/10 p-4
      [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
    >
      <p className="text-xs muted">{title}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function Guideline({ title, body, tag }) {
  return (
    <div
      className="rounded-2xl bg-white/10 border border-white/15 p-4
      [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{title}</p>
        <span
          className="text-[10px] px-2 py-1 rounded-full bg-black/20 border border-white/10 muted
          [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
        >
          {tag}
        </span>
      </div>
      <p className="muted mt-2 text-sm">{body}</p>
    </div>
  );
}

function Check({ ok, label }) {
  return (
    <div className="flex items-center justify-between">
      <span className="muted">{label}</span>
      <span
        className={[
          "text-[10px] px-2 py-1 rounded-full border",
          ok
            ? "bg-[#7CFF6B]/15 border-[#7CFF6B]/40 text-[#7CFF6B]"
            : "bg-red-500/15 border-red-500/30 text-red-200",
        ].join(" ")}
      >
        {ok ? "OK" : "ISSUE"}
      </span>
    </div>
  );
}

/* ===================== UI bits (BASE) ===================== */

function Stat({ title, value }) {
  return (
    <div
      className="rounded-2xl bg-white/10 border border-white/15 p-4
      [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
    >
      <p className="text-xs text-white/70 [html[data-theme='light']_&]:text-slate-600">{title}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs text-white/70 [html[data-theme='light']_&]:text-slate-600">{label}</p>
      {children}
    </div>
  );
}

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
        active
          ? "bg-[#0A8270]/30 border-[#7CFF6B]/30"
          : "bg-white/10 border-white/15 hover:bg-white/15",
        "[html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:hover:bg-slate-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Notice({ type, text }) {
  return (
    <div
      className={[
        "mt-4 text-sm px-3 py-2 rounded-xl border",
        type === "ok"
          ? "bg-[#0A8270]/20 border-[#7CFF6B]/30 text-white"
          : "bg-red-500/15 border-red-500/30 text-red-200",
      ].join(" ")}
    >
      {text}
    </div>
  );
}
