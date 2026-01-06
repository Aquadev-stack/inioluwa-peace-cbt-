import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyTheme, getTheme } from "../api/theme";
import { getAuth, saveAuth, clearAuth } from "../api/authStorage";
import { http } from "../api/http";

export default function SettingsPage() {
  const navigate = useNavigate();

  const auth = getAuth();
  const user = auth?.user;

  const [theme, setTheme] = useState(getTheme());

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  const [avatar, setAvatar] = useState(user?.avatar || "");
  const fileRef = useRef(null);

  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });

  const [msg, setMsg] = useState({ type: "", text: "" });
  const [pwdMsg, setPwdMsg] = useState({ type: "", text: "" });

  // report issue (NOW wired to backend)
  const [report, setReport] = useState({ title: "", message: "" });
  const [reportMsg, setReportMsg] = useState({ type: "", text: "" });

  const adminContact = useMemo(
    () => ({
      whatsapp: "+2348141876919",
      waLink: "https://wa.me/2348141876919",
    }),
    []
  );

  const socials = useMemo(
    () => ({
      aquadev: {
        role: "Front-end & Back-end Developer",
        x: "https://x.com/explorewithaqua",
        facebook: "https://www.facebook.com/Aquadev001",
        whatsapp: "https://wa.me/2349060726213",
      },
      devmaca: {
        role: "Front-end Designer + Python Developer",
        whatsapp: "https://wa.me/2348088009455",
        x: "https://x.com/dtechguy01", // dummy
      },
    }),
    []
  );

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  function onProfileChange(e) {
    setMsg({ type: "", text: "" });
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  }

  function onPwdChange(e) {
    setPwdMsg({ type: "", text: "" });
    const { name, value } = e.target;
    setPwd((p) => ({ ...p, [name]: value }));
  }

  async function saveProfile() {
    setMsg({ type: "", text: "" });
    try {
      const res = await http.put("/auth/me", {
        ...profile,
        avatar,
      });

      saveAuth({ ...auth, user: res.data.user });
      setMsg({ type: "ok", text: "Profile updated ✅" });
    } catch (err) {
      setMsg({
        type: "err",
        text: err?.response?.data?.message || "Failed to update profile",
      });
    }
  }

  async function changePassword() {
    setPwdMsg({ type: "", text: "" });
    try {
      const res = await http.put("/auth/me/password", pwd);
      setPwd({ currentPassword: "", newPassword: "" });
      setPwdMsg({ type: "ok", text: res.data?.message || "Password updated ✅" });
    } catch (err) {
      setPwdMsg({
        type: "err",
        text: err?.response?.data?.message || "Failed to change password",
      });
    }
  }

  function logout() {
    clearAuth();
    navigate("/", { replace: true });
  }

  function pickAvatar() {
    fileRef.current?.click();
  }

  async function onAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return alert("Pick an image");
    if (file.size > 2 * 1024 * 1024) return alert("Max 2MB");

    const base64 = await fileToBase64(file);
    setAvatar(base64);
    setMsg({ type: "", text: "" });
  }

  function copyText(txt) {
    navigator.clipboard?.writeText(txt).then(
      () => alert("Copied ✅"),
      () => alert("Copy failed ❌")
    );
  }

  // ✅ PUT THIS HERE (REPLACES YOUR OLD submitReport)
  async function submitReport() {
    setReportMsg({ type: "", text: "" });

    if (!report.title.trim() || !report.message.trim()) {
      return setReportMsg({ type: "err", text: "Fill report title and message" });
    }

    try {
      const res = await http.post("/reports", report);
      setReport({ title: "", message: "" });
      setReportMsg({ type: "ok", text: res.data?.message || "Report sent ✅" });
    } catch (err) {
      setReportMsg({
        type: "err",
        text: err?.response?.data?.message || "Failed to send report",
      });
    }
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Settings header */}
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Settings</h2>
            <p className="muted mt-2">Update your profile, password and app preferences.</p>
          </div>

          <button
            onClick={logout}
            className="rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 px-4 py-2 text-sm font-medium hover:bg-red-500/20 transition"
          >
            Logout
          </button>
        </div>

        {/* Theme */}
        <div
          className="mt-4 flex items-center justify-between rounded-xl bg-black/20 border border-white/10 p-4
          [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
        >
          <div>
            <p className="font-medium">Theme</p>
            <p className="muted text-xs">Toggle Dark / Light mode</p>
          </div>

          <button
            onClick={toggleTheme}
            className="rounded-xl bg-[#EFBF04] text-slate-900 font-semibold px-4 py-2 hover:brightness-110 transition"
          >
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </Card>

      {/* Profile */}
      <Card>
        <h3 className="text-lg font-semibold">Profile</h3>
        <p className="muted mt-2 text-sm">
          You can edit <b>Name</b>, <b>Email</b> and <b>Photo</b>. Matric & Level are locked.
        </p>

        <div className="mt-4 flex items-center gap-4">
          <div
            className="h-16 w-16 rounded-2xl overflow-hidden bg-black/20 border border-white/10 flex items-center justify-center
            [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
          >
            {avatar ? (
              <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs muted">No photo</span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={pickAvatar}
              className="rounded-xl bg-[#0A8270]/30 border border-[#7CFF6B]/30 px-3 py-2 text-sm hover:bg-[#0A8270]/40 transition"
            >
              Change photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </div>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs muted">Matric (locked)</label>
            <input
              value={user?.matric || ""}
              disabled
              className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none opacity-80
                [html[data-theme='light']_&]:bg-slate-100 [html[data-theme='light']_&]:border-slate-200"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs muted">Level (locked)</label>
            <input
              value={`${user?.level || ""} Level`}
              disabled
              className="mt-2 w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none opacity-80
                [html[data-theme='light']_&]:bg-slate-100 [html[data-theme='light']_&]:border-slate-200"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs muted">Full Name</label>
            <input
              name="name"
              value={profile.name}
              onChange={onProfileChange}
              className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none
                focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20
                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs muted">Email</label>
            <input
              name="email"
              value={profile.email}
              onChange={onProfileChange}
              type="email"
              className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none
                focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20
                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              onClick={saveProfile}
              className="w-full rounded-xl bg-[#EFBF04] text-slate-900 font-semibold py-2.5 hover:brightness-110 transition"
            >
              Save profile
            </button>
          </div>
        </div>

        {msg.text && <Notice type={msg.type} text={msg.text} />}
      </Card>

      {/* Change password */}
      <Card>
        <h3 className="text-lg font-semibold">Change Password</h3>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs muted">Current Password</label>
            <input
              name="currentPassword"
              value={pwd.currentPassword}
              onChange={onPwdChange}
              type="password"
              className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none
                focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20
                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
            />
          </div>

          <div>
            <label className="text-xs muted">New Password</label>
            <input
              name="newPassword"
              value={pwd.newPassword}
              onChange={onPwdChange}
              type="password"
              className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none
                focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20
                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
            />
          </div>

          <div className="sm:col-span-2">
            <button
              onClick={changePassword}
              className="w-full rounded-xl bg-[#0A8270]/30 border border-[#7CFF6B]/30 py-2.5 text-sm hover:bg-[#0A8270]/40 transition"
            >
              Update password
            </button>
          </div>
        </div>

        {pwdMsg.text && <Notice type={pwdMsg.type} text={pwdMsg.text} />}
      </Card>

      {/* Contact admin */}
      <Card>
        <h3 className="text-lg font-semibold">Contact Admin</h3>
        <p className="muted mt-2 text-sm">If you can’t access a PDF or CBT fails — reach out.</p>

        <div
          className="mt-4 rounded-xl bg-black/20 border border-white/10 p-4
          [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
        >
          <p className="text-sm font-semibold">Admin WhatsApp</p>
          <p className="muted mt-1 text-sm">{adminContact.whatsapp}</p>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => copyText(adminContact.whatsapp)}
              className="rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm hover:bg-white/15 transition
                [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
            >
              Copy
            </button>

            <a
              href={adminContact.waLink}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl bg-[#EFBF04]/15 border border-[#EFBF04]/40 px-3 py-2 text-sm hover:bg-[#EFBF04]/20 transition"
            >
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </Card>

      {/* Report issue */}
      <Card>
        <h3 className="text-lg font-semibold">Report an Issue</h3>
        <p className="muted mt-2 text-sm">This sends a message to the Admin Inbox.</p>

        <div className="mt-4 grid gap-3">
          <div>
            <label className="text-xs muted">Title</label>
            <input
              value={report.title}
              onChange={(e) => {
                setReportMsg({ type: "", text: "" });
                setReport((p) => ({ ...p, title: e.target.value }));
              }}
              placeholder="e.g. PDF not downloading"
              className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none
                focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20
                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
            />
          </div>

          <div>
            <label className="text-xs muted">Message</label>
            <textarea
              value={report.message}
              onChange={(e) => {
                setReportMsg({ type: "", text: "" });
                setReport((p) => ({ ...p, message: e.target.value }));
              }}
              placeholder="Explain what happened and what you were doing."
              rows={4}
              className="mt-2 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none resize-none
                focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20
                [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
            />
          </div>

          <button
            onClick={submitReport}
            className="w-full rounded-xl bg-[#0A8270]/30 border border-[#7CFF6B]/30 py-2.5 text-sm hover:bg-[#0A8270]/40 transition"
          >
            Send report
          </button>

          {reportMsg.text && <Notice type={reportMsg.type} text={reportMsg.text} />}
        </div>
      </Card>

      {/* Developers */}
      <Card>
        <h3 className="text-lg font-semibold">Developers</h3>
        <p className="muted mt-2 text-sm">Built with love for Mathematics students — INIOLUWA PEACE CBT.</p>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <DevCard
            name="Aquadev"
            role={socials.aquadev.role}
            whatsapp={socials.aquadev.whatsapp}
            x={socials.aquadev.x}
            facebook={socials.aquadev.facebook}
          />

          <DevCard
            name="devmaca"
            role={socials.devmaca.role}
            whatsapp={socials.devmaca.whatsapp}
            x={socials.devmaca.x}
            removeFacebook
          />
        </div>

        <p className="muted mt-4 text-xs">© {new Date().getFullYear()} • Aquadev × devmaca</p>
      </Card>
    </div>
  );
}

/* ============= Small components ============= */

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

function Notice({ type, text }) {
  return (
    <div
      className={[
        "mt-3 text-sm px-3 py-2 rounded-xl border",
        type === "ok"
          ? "bg-[#0A8270]/20 border-[#7CFF6B]/30"
          : "bg-red-500/15 border-red-500/30 text-red-200",
      ].join(" ")}
    >
      {text}
    </div>
  );
}

function DevCard({ name, role, whatsapp, x, facebook, removeFacebook }) {
  return (
    <div
      className="rounded-2xl bg-black/20 border border-white/10 p-5
      [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
    >
      <p className="font-semibold text-base">{name}</p>
      <p className="muted text-sm mt-1">{role}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-[#0A8270]/25 border border-[#7CFF6B]/30 px-3 py-2 text-xs hover:bg-[#0A8270]/35 transition"
          >
            WhatsApp
          </a>
        )}

        {x && (
          <a
            href={x}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-xs hover:bg-white/15 transition
              [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
          >
            X (Twitter)
          </a>
        )}

        {!removeFacebook && facebook && (
          <a
            href={facebook}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-[#EFBF04]/15 border border-[#EFBF04]/40 px-3 py-2 text-xs hover:bg-[#EFBF04]/20 transition"
          >
            Facebook
          </a>
        )}
      </div>
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
