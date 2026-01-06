import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import { http } from "../api/http";
import { saveAuth } from "../api/authStorage";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    setErr("");
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.email || !form.password) return setErr("Fill all fields");

    try {
      setLoading(true);

      const res = await http.post("/auth/login", {
        email: form.email,
        password: form.password,
      });

      // save token + user to localStorage AND attach bearer token
      saveAuth(res.data);

      // ✅ IMPORTANT: redirect by role
      const role = res.data?.user?.role;

      if (role === "admin") {
        navigate("/dashboard/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      const msg = error?.response?.data?.message || "Login failed";
      setErr(msg);
    } finally {
      setLoading(false);
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
            <h1 className="text-lg sm:text-xl font-semibold leading-tight">Login</h1>
            <p className="text-[11px] sm:text-xs text-white/70">INIOLUWA PEACE CBT</p>
          </div>
        </div>

        {err && (
          <div className="mt-4 text-sm bg-red-500/15 border border-red-500/30 text-red-200 px-3 py-2 rounded-lg">
            {err}
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
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

          <div>
            <label className="text-xs text-white/75">Password</label>
            <input
              name="password"
              value={form.password}
              onChange={onChange}
              type="password"
              placeholder="Password"
              className="mt-2 w-full rounded-lg bg-white/15 border border-white/15 px-3 py-2 text-sm outline-none focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#EFBF04] text-slate-900 font-semibold py-2.5 hover:brightness-110 transition shadow-[0_12px_30px_rgba(239,191,4,0.25)] disabled:opacity-70"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-xs text-white/70 text-center pt-1">
            Don’t have an account?{" "}
            <Link className="text-[#7CFF6B] hover:underline" to="/register">
              Register
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
