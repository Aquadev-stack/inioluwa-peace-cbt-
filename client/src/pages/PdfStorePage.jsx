import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";

export default function PdfStorePage() {
  const [q, setQ] = useState("");
  const [level, setLevel] = useState(100);

  const [loading, setLoading] = useState(false);
  const [itemsRaw, setItemsRaw] = useState([]);
  const [err, setErr] = useState("");

  // fetch from backend whenever level or q changes (with small debounce)
  useEffect(() => {
    let alive = true;
    setErr("");
    setLoading(true);

    const t = setTimeout(async () => {
      try {
        const res = await http.get("/api/pdfs", {
          params: { level, q },
        });

        if (!alive) return;
        setItemsRaw(res.data.items || []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.response?.data?.message || "Failed to load PDFs");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    }, 250);

    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [level, q]);

  const items = useMemo(() => itemsRaw || [], [itemsRaw]);

  function openPdf(item) {
    // backend returns fileUrl like: /uploads/pdfs/xxxx.pdf
    if (!item?.fileUrl) return alert("PDF missing link");
    window.open(`http://localhost:5000${item.fileUrl}`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4 pt-2">
      <div
        className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-6
        [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">PDF Store</h2>
            <p className="text-white/70 mt-2 [html[data-theme='light']_&]:text-slate-600">
              Download course materials, past questions and revision packs.
            </p>
          </div>

          {/* Level switch */}
          <div
            className="rounded-xl bg-black/20 border border-white/10 p-1 flex
            [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
          >
            <button
              type="button"
              onClick={() => setLevel(100)}
              className={[
                "px-3 py-2 text-xs rounded-lg transition",
                level === 100
                  ? "bg-[#0A8270]/35 border border-[#7CFF6B]/40 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/5 [html[data-theme='light']_&]:text-slate-700",
              ].join(" ")}
            >
              100lv
            </button>

            <button
              type="button"
              onClick={() => setLevel(200)}
              className={[
                "px-3 py-2 text-xs rounded-lg transition",
                level === 200
                  ? "bg-[#EFBF04]/20 border border-[#EFBF04]/40 text-white"
                  : "text-white/70 hover:text-white hover:bg-white/5 [html[data-theme='light']_&]:text-slate-700",
              ].join(" ")}
            >
              200lv
            </button>
          </div>
        </div>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${level}lv PDFs (e.g. MTH101)`}
          className="mt-4 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm outline-none
            focus:border-[#7CFF6B]/60 focus:ring-2 focus:ring-[#7CFF6B]/20
            [html[data-theme='light']_&]:bg-slate-50 [html[data-theme='light']_&]:border-slate-200"
        />

        <p className="mt-2 text-xs text-white/60 [html[data-theme='light']_&]:text-slate-500">
          {loading ? "Loading..." : `Showing ${items.length} item(s) • Level ${level}`}
        </p>

        {err && (
          <div className="mt-3 text-sm bg-red-500/15 border border-red-500/30 text-red-200 px-3 py-2 rounded-lg">
            {err}
          </div>
        )}
      </div>

      {!loading && items.length === 0 ? (
        <div
          className="rounded-2xl bg-black/20 border border-white/10 p-6 text-sm text-white/70
          [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:text-slate-600"
        >
          No PDFs found for this level and search. Try another keyword.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((b) => (
            <div
              key={b._id}
              className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-5 hover:bg-white/15 transition
                [html[data-theme='light']_&]:bg-white [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:hover:bg-slate-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold leading-tight">{b.title}</h3>
                  <p className="text-xs text-white/70 mt-1 [html[data-theme='light']_&]:text-slate-600">
                    {b.course} • {b.level} Level
                  </p>
                </div>

                {b.isNew && (
                  <span className="text-[10px] px-2 py-1 rounded-full bg-[#7CFF6B]/15 border border-[#7CFF6B]/40 text-[#7CFF6B]">
                    NEW
                  </span>
                )}
              </div>

              <button
                onClick={() => openPdf(b)}
                className="mt-4 w-full rounded-xl bg-[#0A8270]/30 border border-[#7CFF6B]/30 py-2 text-sm hover:bg-[#0A8270]/40 transition"
              >
                View / Download
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
