"use client";

import { useEffect, useState } from "react";
import MapWrapper from "@/components/MapWrapper";
import { CategoryBarChart, UrgencyPieChart } from "@/components/DashboardCharts";

export default function DashboardPage() {
  const [complaints, setComplaints] = useState([]);
  const [regions, setRegions] = useState([]);
  const [hotspots, setHotspots] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  useEffect(() => {
    fetch("/api/complaints").then((r) => r.json()).then((d) => setComplaints(d.complaints || []));
    fetch("/api/districts").then((r) => r.json()).then((d) => setRegions(d.regions || []));
    fetch("/api/recommendations")
      .then((r) => r.json())
      .then((d) => {
        setRecommendations(d.recommendations || []);
        setHotspots(d.recommendations || []);
        setLoadingRecs(false);
      });
  }, []);

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

  return (
    <main className="container" style={{ padding: "40px 28px 90px" }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>POLICYMAKER VIEW — LIVE</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, marginBottom: 28, letterSpacing: "-0.01em" }}>
        Constituency demand dashboard
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 30 }}>
        <StatCard label="Total complaints" value={complaints.length} />
        <StatCard label="Districts affected" value={districtsAffected} />
        <StatCard label="Critical urgency" value={criticalCount} accent="var(--signal)" />
        <StatCard label="Recommended projects" value={recommendations.length} />
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>DEMAND HOTSPOTS — MARKER SIZE = PRIORITY SCORE</div>
        <MapWrapper hotspots={hotspots} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 30 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>COMPLAINTS BY ISSUE TYPE</div>
          <CategoryBarChart data={categoryData} />
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>URGENCY DISTRIBUTION</div>
          <UrgencyPieChart data={urgencyData} />
        </div>
      </div>

      <div className="eyebrow" style={{ marginBottom: 14 }}>
        RANKED DEVELOPMENT RECOMMENDATIONS — DEMAND × INFRASTRUCTURE GAP ÷ EXISTING INVESTMENT
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loadingRecs && <p style={{ color: "var(--muted)", fontSize: 14 }}>Generating recommendations…</p>}
        {recommendations.map((r, i) => (
          <div
            key={i}
            className="card"
            style={{ padding: "16px 20px", display: "flex", gap: 18, alignItems: "flex-start" }}
          >
            <div
              className="stat-num"
              style={{
                fontSize: 22,
                color: "var(--signal)",
                width: 34,
                flexShrink: 0,
                textAlign: "center",
              }}
            >
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                <strong style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{r.regionName}</strong>
                <span className={`pill pill-${r.category}`}>{r.category}</span>
                <span className="pill" style={{ background: "#eee", color: "#555" }}>
                  score {r.priorityScore}
                </span>
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
        {!loadingRecs && recommendations.length === 0 && (
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
