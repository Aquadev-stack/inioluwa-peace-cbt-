// client/src/pages/DashboardHome.jsx
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth } from "../api/authStorage";
import logo from "../assets/logo1.png";

// ✅ use your real course lists (single source of truth)
import { courses100_1st, courses200_1st } from "../data/courses";

export default function DashboardHome() {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth?.user;

  useEffect(() => {
    if (user?.role === "admin") {
      navigate("/dashboard/admin", { replace: true });
    }
  }, [user?.role, navigate]);

  // ✅ show based on student level, but fallback safely
  const courses = useMemo(() => {
    const lv = Number(user?.level || 100);

    // only show the proper set for their level
    if (lv === 200) return courses200_1st;
    return courses100_1st;
  }, [user?.level]);

  const greetLine = useMemo(() => {
    const lv = Number(user?.level || 100);

    if (lv === 100) return "100 Level mode: start strong, build confidence, master basics.";
    if (lv === 200) return "200 Level mode: deeper questions, faster speed, smarter revision.";
    return "Your CBT space is ready.";
  }, [user?.level]);

  return (
    <div className="space-y-4 pt-2">
      {/* Hero card */}
      <div
        className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-6
        [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
      >
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden">
            <img src={logo} alt="INIOLUWA PEACE CBT" className="h-10 w-10 object-contain" />
          </div>

          <div className="min-w-0">
            <h2 className="text-xl font-semibold truncate">
              Welcome{user?.name ? `, ${user.name}` : ""}
            </h2>
            <p className="text-white/70 [html[data-theme='light']_&]:text-slate-600 text-sm mt-1">
              INIOLUWA PEACE CBT: Learn faster. Practice smart. Track progress.
            </p>
            <p className="text-xs mt-2 text-white/70 [html[data-theme='light']_&]:text-slate-600">
              {greetLine}
            </p>
          </div>
        </div>

        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <Stat title="Level" value={`${user?.level || 100}lv`} />
          <Stat title="Role" value={user?.role || "student"} />
          <Stat title="Matric" value={user?.matric || "-"} />
        </div>

        {/* Quick actions */}
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          <Action
            title="Open PDF Store"
            desc="Find notes & past questions"
            onClick={() => navigate("/dashboard/pdfs")}
            tone="green"
          />
          <Action
            title="Start CBT Practice"
            desc="Exam mode + special sets"
            onClick={() => navigate("/dashboard/cbt")}
            tone="gold"
          />
          <Action
            title="Leaderboard"
            desc="See rankings per course"
            onClick={() => navigate("/dashboard/leaderboard")}
            tone="dark"
          />
        </div>
      </div>

      {/* How it works + what’s inside */}
      <div className="grid lg:grid-cols-3 gap-3">
        <Card>
          <h3 className="text-lg font-semibold">How this CBT helps you</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li className="muted">• Practice by course and level (100lv / 200lv).</li>
            <li className="muted">• Attempt → review → retry to improve fast.</li>
            <li className="muted">• Real exam vibe: timed sessions.</li>
            <li className="muted">• Leaderboard shows best % and time.</li>
          </ul>

          <div
            className="mt-4 rounded-xl bg-black/20 border border-white/10 p-4
            [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
          >
            <p className="text-xs muted">
              Tip: Use PDFs first, then CBT. That combo makes you sharp fast.
            </p>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">
            Available courses ({user?.level || 100}lv)
          </h3>
          <p className="muted mt-2 text-sm">
            These are the courses currently active in the system.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {courses.map((c) => (
              <span
                key={c.code}
                className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/15
                  [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
                title={c.title}
              >
                <span className="font-semibold">{c.code}</span>
              </span>
            ))}
          </div>

          <p className="muted mt-4 text-xs">
            Don’t see your course yet? It may be added soon by admin uploads.
          </p>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold">What’s live</h3>

          <div className="mt-3 space-y-3">
            <MiniItem title="PDF Store" badge="LIVE" text="Search by course code and download packs." />
            <MiniItem title="Admin uploads" badge="LIVE" text="Admins can upload PDFs and manage them." />
            <MiniItem title="CBT engine" badge="LIVE" text="Timed exam mode, review, and corrections." />
            <MiniItem title="Leaderboard" badge="LIVE" text="Ranks students per course by best % and time." />
          </div>
        </Card>
      </div>

      {/* Footer info */}
      <div
        className="rounded-2xl bg-black/20 border border-white/10 p-6 text-sm text-white/70
        [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:text-slate-600"
      >
        Use the bottom tabs to access PDFs, CBT practice, leaderboard and settings.
        <div className="mt-3 text-xs muted">
          Built by Aquadev • devmaca — © {new Date().getFullYear()} INIOLUWA PEACE CBT
        </div>
      </div>
    </div>
  );
}

/* ===================== UI Bits ===================== */

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

function Card({ children }) {
  return (
    <div
      className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-6
      [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
    >
      <div className="[&_.muted]:text-white/70 [html[data-theme='light']_&]:[&_.muted]:text-slate-600">
        {children}
      </div>
    </div>
  );
}

function MiniItem({ title, badge, text }) {
  const isLive = badge === "LIVE";

  return (
    <div
      className="rounded-xl bg-black/20 border border-white/10 p-4
      [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold">{title}</p>
        <span
          className={[
            "text-[10px] px-2 py-1 rounded-full border",
            isLive
              ? "bg-[#7CFF6B]/15 border-[#7CFF6B]/40 text-[#7CFF6B]"
              : "bg-[#EFBF04]/15 border-[#EFBF04]/40 text-[#EFBF04]",
          ].join(" ")}
        >
          {badge}
        </span>
      </div>
      <p className="muted text-sm mt-2">{text}</p>
    </div>
  );
}

function Action({ title, desc, onClick, tone = "green" }) {
  const styles =
    tone === "gold"
      ? "bg-[#EFBF04]/15 border-[#EFBF04]/40 hover:bg-[#EFBF04]/20"
      : tone === "dark"
      ? "bg-white/10 border-white/15 hover:bg-white/15"
      : "bg-[#0A8270]/20 border-[#7CFF6B]/30 hover:bg-[#0A8270]/28";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "text-left rounded-2xl border p-4 transition",
        "active:scale-[0.99]",
        styles,
        "[html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:hover:bg-slate-100",
      ].join(" ")}
    >
      <p className="font-semibold">{title}</p>
      <p className="muted text-sm mt-1">{desc}</p>
    </button>
  );
}
