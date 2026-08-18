export default function HomePage() {
  return (
    <main>
      <section style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="container" style={{ padding: "72px 28px 56px" }}>
          <div className="eyebrow" style={{ marginBottom: 18 }}>
            DIGITAL PUBLIC GOOD — PROTOTYPE — BRICS DEMAND INTELLIGENCE TRACK
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(34px, 5vw, 58px)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 780,
              margin: "0 0 22px",
            }}
          >
            Every complaint is a data point.
            <br />
            Every hotspot is a <span style={{ color: "var(--signal)" }}>budget decision</span>.
          </h1>
          <p style={{ fontSize: 18, color: "var(--muted)", maxWidth: 620, lineHeight: 1.6, margin: "0 0 32px" }}>
            JanVaani ingests citizen development requests in any language, over any channel,
            and cross-references them against demographic data, infrastructure indices, and
            existing investment plans — so policymakers see exactly where to spend next, and why.
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <a href="/submit" className="btn btn-signal">
              File a complaint →
            </a>
            <a href="/dashboard" className="btn btn-primary">
              Open policymaker dashboard →
            </a>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: "48px 28px 72px" }}>
        <div className="eyebrow" style={{ marginBottom: 16 }}>HOW A COMPLAINT BECOMES A BUDGET LINE</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            background: "var(--line)",
            border: "1px solid var(--line)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {[
            {
              label: "Ingest",
              body: "Voice, text, WhatsApp-style, and walk-in submissions, in Hindi, Marathi, English or code-switched mixes.",
            },
            {
              label: "Classify",
              body: "An LLM extracts issue category, urgency, and location — or a rule-based fallback runs offline.",
            },
            {
              label: "Cross-reference",
              body: "Complaint volume is weighed against each district's infrastructure index and current public investment.",
            },
            {
              label: "Recommend",
              body: "A ranked, explainable priority list is generated for national and constituency-level budget allocation.",
            },
          ].map((step, i) => (
            <div key={step.label} style={{ background: "var(--paper)", padding: "26px 22px" }}>
              <div className="stat-num" style={{ fontSize: 13, color: "var(--signal)", marginBottom: 10 }}>
                0{i + 1}
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 17, marginBottom: 8 }}>
                {step.label}
              </div>
              <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.55 }}>{step.body}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ background: "var(--indigo-deep)", color: "#fff" }}>
        <div className="container" style={{ padding: "48px 28px", display: "flex", gap: 40, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 280px" }}>
            <div className="eyebrow" style={{ color: "#a9adc9", marginBottom: 10 }}>
              DESIGNED AS A DIGITAL PUBLIC GOOD
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.65, color: "#d3d5e6", maxWidth: 480 }}>
              The schema separates citizen input, national reference data (demographics,
              infrastructure indices, investment plans), and scoring logic. Any BRICS nation
              can plug in its own regional dataset without touching the pipeline.
            </p>
          </div>
          <div style={{ flex: "1 1 280px", fontFamily: "var(--font-mono)", fontSize: 13, color: "#9aa0c4" }}>
            <div style={{ marginBottom: 6 }}>region.demographic → population, income index</div>
            <div style={{ marginBottom: 6 }}>region.infraIndex → water, roads, power, health, sanitation</div>
            <div style={{ marginBottom: 6 }}>region.currentInvestment → per-sector budget already committed</div>
            <div>complaint → category, urgency, language, regionId</div>
          </div>
        </div>
      </section>
    </main>
  );
}
