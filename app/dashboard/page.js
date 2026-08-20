"use client";

import { useEffect, useState } from "react";
import MapWrapper from "@/components/MapWrapper";
import { CategoryBarChart, UrgencyPieChart, TrendLineChart } from "@/components/DashboardCharts";

function useGate() {
  const [gated, setGated] = useState(null); // null = checking, true = needs passcode, false = open
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" && sessionStorage.getItem("janvaani_unlocked");
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode: stored || "" }),
    })
      .then((r) => r.json())
      .then((d) => {
        setGated(d.gated);
        if (!d.gated || d.ok) setUnlocked(true);
      })
      .catch(() => {
        // If the auth check itself fails, don't lock the demo out
        setGated(false);
        setUnlocked(true);
      });
  }, []);

  async function tryUnlock(passcode) {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passcode }),
    });
    const data = await res.json();
    if (data.ok) {
      sessionStorage.setItem("janvaani_unlocked", passcode);
      setUnlocked(true);
      return true;
    }
    return false;
  }

  return { gated, unlocked, tryUnlock };
}

function PasscodeGate({ onUnlock }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  async function submit(e) {
    e.preventDefault();
    const ok = await onUnlock(value);
    setError(!ok);
  }

  return (
    <main className="container" style={{ padding: "90px 28px", maxWidth: 420 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>RESTRICTED — POLICYMAKER ACCESS</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, marginBottom: 16 }}>
        Enter dashboard passcode
      </h1>
      <form onSubmit={submit} className="card" style={{ padding: 20 }}>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Passcode"
          style={{ width: "100%", padding: 12, border: "1px solid var(--line)", borderRadius: 8, fontSize: 15, marginBottom: 12 }}
        />
        <button type="submit" className="btn btn-signal" style={{ width: "100%" }}>
          Unlock
        </button>
        {error && <p style={{ color: "#b8391a", fontSize: 13, marginTop: 10 }}>Incorrect passcode. Try again.</p>}
      </form>
    </main>
  );
}

export default function DashboardPage() {
  const { gated, unlocked, tryUnlock } = useGate();
  const [complaints, setComplaints] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!unlocked) return;

    fetch("/api/complaints")
      .then((r) => {
        if (!r.ok) throw new Error("complaints");
        return r.json();
      })
      .then((d) => setComplaints(d.complaints || []))
      .catch(() => setErrors((e) => ({ ...e, complaints: true })));

    fetch("/api/recommendations")
      .then((r) => {
        if (!r.ok) throw new Error("recommendations");
        return r.json();
      })
      .then((d) => {
        setRecommendations(d.recommendations || []);
        setLoadingRecs(false);
      })
      .catch(() => {
        setErrors((e) => ({ ...e, recommendations: true }));
        setLoadingRecs(false);
      });

    fetch("/api/trend")
      .then((r) => {
        if (!r.ok) throw new Error("trend");
        return r.json();
      })
      .then((d) => setTrend(d.trend || []))
      .catch(() => setErrors((e) => ({ ...e, trend: true })));
  }, [unlocked]);

  if (gated === null) {
    return (
      <main className="container" style={{ padding: "90px 28px" }}>
        <p style={{ color: "var(--muted)", fontSize: 14 }}>Checking access…</p>
      </main>
    );
  }

  if (gated && !unlocked) {
    return <PasscodeGate onUnlock={tryUnlock} />;
  }

  const categoryData = Object.entries(
    complaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([category, count]) => ({ category, count }));

  const urgencyData = Object.entries(
    complaints.reduce((acc, c) => {
      acc[c.urgency] = (acc[c.urgency] || 0) + 1;
      return acc;
    }, {})
  ).map(([urgency, count]) => ({ urgency, count }));

  const districtsAffected = new Set(complaints.map((c) => c.regionId).filter(Boolean)).size;
  const criticalCount = complaints.filter((c) => c.urgency === "critical").length;
  const distinctIssueCount = new Set(complaints.map((c) => c.clusterId || c.id)).size;
  const duplicatesMerged = complaints.length - distinctIssueCount;

  return (
    <main className="container" style={{ padding: "40px 28px 90px" }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>POLICYMAKER VIEW — LIVE</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, marginBottom: 8, letterSpacing: "-0.01em" }}>
        Constituency demand dashboard
      </h1>
      {duplicatesMerged > 0 && (
        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24 }}>
          {complaints.length} reports received → {distinctIssueCount} distinct issues after merging {duplicatesMerged} likely duplicate report(s).
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 30 }}>
        <StatCard label="Total reports" value={complaints.length} />
        <StatCard label="Distinct issues" value={distinctIssueCount} />
        <StatCard label="Districts affected" value={districtsAffected} />
        <StatCard label="Critical urgency" value={criticalCount} accent="var(--signal)" />
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>DEMAND HOTSPOTS — MARKER SIZE = PRIORITY SCORE</div>
        {errors.recommendations ? (
          <ErrorNote label="hotspot map" />
        ) : (
          <MapWrapper hotspots={recommendations} />
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>COMPLAINTS BY ISSUE TYPE</div>
          {errors.complaints ? <ErrorNote label="category chart" /> : <CategoryBarChart data={categoryData} />}
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>URGENCY DISTRIBUTION</div>
          {errors.complaints ? <ErrorNote label="urgency chart" /> : <UrgencyPieChart data={urgencyData} />}
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 30 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>IMPACT OVER TIME — REPORTS PER WEEK BY CATEGORY</div>
        <p style={{ fontSize: 12.5, color: "var(--muted)", marginBottom: 10 }}>
          Use this to check whether a category is escalating, plateauing, or improving after budget is allocated.
        </p>
        {errors.trend ? <ErrorNote label="trend chart" /> : <TrendLineChart data={trend} />}
      </div>

      <div className="eyebrow" style={{ marginBottom: 14 }}>
        RANKED DEVELOPMENT RECOMMENDATIONS — DEMAND × INFRASTRUCTURE GAP ÷ EXISTING INVESTMENT
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loadingRecs && <p style={{ color: "var(--muted)", fontSize: 14 }}>Generating recommendations…</p>}
        {errors.recommendations && <ErrorNote label="recommendations" />}
        {recommendations.map((r, i) => (
          <div key={i} className="card" style={{ padding: "16px 20px", display: "flex", gap: 18, alignItems: "flex-start" }}>
            <div className="stat-num" style={{ fontSize: 22, color: "var(--signal)", width: 34, flexShrink: 0, textAlign: "center" }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                <strong style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{r.regionName}</strong>
                <span className={`pill pill-${r.category}`}>{r.category}</span>
                <span className="pill" style={{ background: "#eee", color: "#555" }}>score {r.priorityScore}</span>
                {r.distinctIssues < r.complaintCount && (
                  <span className="pill" style={{ background: "#e6efe9", color: "#2c6b4f" }}>
                    {r.complaintCount} reports → {r.distinctIssues} issue(s)
                  </span>
                )}
              </div>
              <p style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55, margin: 0 }}>{r.rationale}</p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)" }}>
              infra {r.infraIndex}/100
              <br />
              ₹{r.currentInvestmentINRLakh}L invested
            </div>
          </div>
        ))}
        {!loadingRecs && !errors.recommendations && recommendations.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>No complaints yet — submit one to see recommendations appear here.</p>
        )}
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className="card" style={{ padding: "18px 20px" }}>
      <div className="eyebrow" style={{ marginBottom: 8 }}>{label}</div>
      <div className="stat-num" style={{ fontSize: 30, color: accent || "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

function ErrorNote({ label }) {
  return (
    <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
      Couldn't load {label} right now. Refresh to try again.
    </div>
  );
}
