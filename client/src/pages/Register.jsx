import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { http } from "../api/http";
import { saveAuth } from "../api/authStorage";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    matric: "",
    password: "",
    level: 100,
  });
  const [err, setErr] = useState("");

  const matricRegex = useMemo(() => /^[A-Z]{3}\/\d{4}\/\d{3,6}$/i, []);

  function onChange(e) {
    setErr("");
    const { name, value } = e.target;

    if (name === "matric") {
      setForm((p) => ({ ...p, matric: value.toUpperCase() }));
      return;
    }

    setForm((p) => ({ ...p, [name]: name === "level" ? Number(value) : value }));
  }

  function validate() {
    if (!form.name || !form.email || !form.matric || !form.password) return "Fill all fields";
    if (!matricRegex.test(form.matric)) return "Matric format: MTH/2024/1234";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    return "";
  }

  async function onSubmit(e) {
    e.preventDefault();
    const v = validate();
    if (v) return setErr(v);

    try {
      const res = await http.post("/auth/register", {
        name: form.name,
        email: form.email,
        matric: form.matric,
        level: form.level,
        password: form.password,
      });

      saveAuth(res.data); // { token, user }
      navigate("/dashboard");
    } catch (error) {
      const msg = error?.response?.data?.message || "Registration failed";
      setErr(msg);
    }
  }

  return (
    <div className="min-h-screen bg-slate-800 relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-gradient-to-br from-[#7CFF6B]/25 via-[#0A8270]/25 to-[#053419]/80" />

      <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-5xl h-[520px] sm:h-[560px] rounded-[28px] bg-black/15 border border-white/10 backdrop-blur-2xl shadow-2xl" />
      </div>

      <div className="relative w-full max-w-md rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl shadow-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-black/30 border border-white/10 flex items-center justify-center overflow-hidden">
            <img src={logo} alt="INIOLUWA PEACE CBT" className="h-10 w-10 object-contain" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-semibold leading-tight">Create Account</h1>
            <p className="text-[11px] sm:text-xs text-white/70">INIOLUWA PEACE CBT</p>
          </div>
        </div>

        {err && (
          <div className="mt-4 text-sm bg-red-500/15 border border-red-500/30 text-red-200 px-3 py-2 rounded-lg">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs text-white/75">Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={onChange}
                type="text"
                placeholder="Full Name"
                className="mt-2 w-full rounded-lg bg-white/15 border border-white/15 px-3 py-2 text-sm outline-none focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-white/75">Email</label>
              <input
                name="email"
                value={form.email}
                onChange={onChange}
                type="email"
                placeholder="example@gmail.com"
                className="mt-2 w-full rounded-lg bg-white/15 border border-white/15 px-3 py-2 text-sm outline-none focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-white/75">Matric Number</label>
              <input
                name="matric"
                value={form.matric}
                onChange={onChange}
                type="text"
                placeholder="MTH/2024/1234"
                className="mt-2 w-full rounded-lg bg-white/15 border border-white/15 px-3 py-2 text-sm outline-none tracking-wider focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20"
              />
              <p className="text-[11px] text-white/60 mt-1">Format: MTH/2024/1234</p>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs text-white/75">Password</label>
              <input
                name="password"
                value={form.password}
                onChange={onChange}
                type="password"
                placeholder="Create password"
                className="mt-2 w-full rounded-lg bg-white/15 border border-white/15 px-3 py-2 text-sm outline-none focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/75">Level</label>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, level: 100 }))}
                className={[
                  "rounded-lg border px-3 py-2 text-sm font-medium transition",
                  form.level === 100
                    ? "bg-[#0A8270]/35 border-[#7CFF6B]/60 text-white shadow-[0_0_25px_rgba(124,255,107,0.10)]"
                    : "bg-white/10 border-white/15 text-white/80 hover:bg-white/15",
                ].join(" ")}
              >
                100 Level
                <span className="block text-[11px] text-white/70 font-normal mt-0.5">Freshers pack</span>
              </button>

              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, level: 200 }))}
                className={[
                  "rounded-lg border px-3 py-2 text-sm font-medium transition",
                  form.level === 200
                    ? "bg-[#EFBF04]/20 border-[#EFBF04]/70 text-white shadow-[0_0_25px_rgba(239,191,4,0.10)]"
                    : "bg-white/10 border-white/15 text-white/80 hover:bg-white/15",
                ].join(" ")}
              >
                200 Level
                <span className="block text-[11px] text-white/70 font-normal mt-0.5">Advanced pack</span>
              </button>
            </div>

            <input type="hidden" name="level" value={form.level} />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-[#EFBF04] text-slate-900 font-semibold py-2.5 hover:brightness-110 transition shadow-[0_12px_30px_rgba(239,191,4,0.25)] cursor-pointer"
          >
            Create account
          </button>

          <p className="text-xs text-white/70 text-center">
            Already have an account?{" "}
            <Link className="text-[#7CFF6B] hover:underline" to="/">
              Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
