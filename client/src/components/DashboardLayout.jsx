import { NavLink } from "react-router-dom";
import { Home, Trophy, FileText, Settings, Laptop } from "lucide-react";

const tabs = [
  { to: "/dashboard", label: "Home", icon: Home, end: true },
  { to: "/dashboard/pdfs", label: "PDFs", icon: FileText },
  { to: "/dashboard/cbt", label: "CBT", icon: Laptop, center: true },
  { to: "/dashboard/leaderboard", label: "Rank", icon: Trophy },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-800 text-white
      [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:text-slate-900">
      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
        {children}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/70 backdrop-blur border-t border-white/10
        [html[data-theme='light']_&]:bg-white/80 [html[data-theme='light']_&]:border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="grid grid-cols-5 items-end">
            {tabs.map((t) => {
              const Icon = t.icon;

              if (t.center) {
                return (
                  <NavLink key={t.to} to={t.to} className="flex flex-col items-center justify-center -mt-7">
                    <div className="h-14 w-14 rounded-2xl bg-[#EFBF04] text-slate-900 flex items-center justify-center
                      shadow-[0_18px_40px_rgba(239,191,4,0.25)] hover:brightness-110 transition">
                      <Icon size={22} />
                    </div>
                    <span className="text-[11px] mt-1 text-white/70
                      [html[data-theme='light']_&]:text-slate-600">CBT</span>
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    [
                      "flex flex-col items-center gap-1 py-1 transition",
                      isActive
                        ? "text-[#7CFF6B]"
                        : "text-white/70 hover:text-white [html[data-theme='light']_&]:text-slate-600 [html[data-theme='light']_&]:hover:text-slate-900",
                    ].join(" ")
                  }
                >
                  <Icon size={18} />
                  <span className="text-[11px]">{t.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
