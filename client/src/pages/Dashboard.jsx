import { getAuth, clearAuth } from "../api/authStorage";

export default function Dashboard() {
  const auth = getAuth();
  const user = auth?.user;

  return (
    <div className="min-h-screen bg-slate-800 text-white p-4 sm:p-6">
      <div className="max-w-4xl mx-auto rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl shadow-2xl p-6">
        <h1 className="text-2xl font-bold">User Dashboard</h1>
        <p className="text-white/70 mt-1">INIOLUWA PEACE CBT</p>

        <div className="mt-6 grid gap-3 text-sm">
          <div>
            <span className="text-white/60">Name:</span>{" "}
            <span className="font-medium">{user?.name}</span>
          </div>
          <div>
            <span className="text-white/60">Email:</span>{" "}
            <span className="font-medium">{user?.email}</span>
          </div>
          <div>
            <span className="text-white/60">Matric:</span>{" "}
            <span className="font-medium">{user?.matric}</span>
          </div>
          <div>
            <span className="text-white/60">Level:</span>{" "}
            <span className="font-medium">{user?.level} Level</span>
          </div>
        </div>

        <button
          onClick={() => {
            clearAuth();
            window.location.href = "/";
          }}
          className="mt-6 rounded-lg bg-[#EFBF04] text-slate-900 font-semibold px-4 py-2 hover:brightness-110 transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
