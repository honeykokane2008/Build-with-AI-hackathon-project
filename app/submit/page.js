"use client";

import { useState, useRef } from "react";

const CHANNELS = [
  { id: "text", label: "Text" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "voice", label: "Voice" },
  { id: "walk-in", label: "Walk-in" },
];

const SAMPLES = [
  "गावात गेल्या दोन आठवड्यांपासून पाणी पुरवठा बंद आहे, महिलांना लांबून पाणी आणावे लागते.",
  "The main road near the market has huge potholes and two accidents happened this month.",
  "प्राथमिक स्वास्थ्य केंद्र में डॉक्टर नहीं आ रहे, मरीजों को 40 किमी दूर जाना पड़ता है।",
  "எங்கள் தெருவில் சாலை மிகவும் மோசமாக உள்ளது, குழிகள் நிறைந்துள்ளன.",
  "ਸਾਡੇ ਇਲਾਕੇ ਵਿੱਚ ਇੱਕ ਹਫ਼ਤੇ ਤੋਂ ਬਿਜਲੀ ਨਹੀਂ ਹੈ।",
  "আমাদের গ্রামে দুই সপ্তাহ ধরে পানীয় জলের সরবরাহ বন্ধ আছে।",
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function SubmitPage() {
  const [text, setText] = useState("");
  const [channel, setChannel] = useState("text");
  const [status, setStatus] = useState("idle"); // idle | loading | done | error | ratelimited
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setStatus("loading");
    setResult(null);
    setErrorMsg("");
    try {
      let imageBase64 = null;
      let imageMimeType = null;
      if (photoFile) {
        imageBase64 = await fileToBase64(photoFile);
        imageMimeType = photoFile.type;
      }

      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, channel, imageBase64, imageMimeType }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setStatus("ratelimited");
        setErrorMsg(data.error || "Too many submissions — please wait a minute.");
        return;
      }
      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      setResult(data.complaint);
      setStatus("done");
      setText("");
      setPhotoFile(null);
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setStatus("error");
      setErrorMsg("Something went wrong — please try again.");
    }
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input isn't supported in this browser. Try Chrome desktop.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    setListening(true);
    setChannel("voice");
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setText((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
  }

  return (
    <main className="container" style={{ padding: "56px 28px 80px", maxWidth: 720 }}>
      <div className="eyebrow" style={{ marginBottom: 14 }}>CITIZEN SUBMISSION — ANY LANGUAGE, ANY CHANNEL</div>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 34, marginBottom: 10, letterSpacing: "-0.01em" }}>
        Tell us what needs fixing
      </h1>
      <p style={{ color: "var(--muted)", marginBottom: 30, lineHeight: 1.6 }}>
        Write in Hindi, Marathi, English, or a mix — the system detects language and
        classifies the issue automatically. Try one of the sample complaints below, add
        a photo as evidence, or use voice input.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {SAMPLES.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setText(s)}
            className="btn"
            style={{ background: "var(--panel)", border: "1px solid var(--line)", fontSize: 12.5, fontWeight: 500, color: "var(--muted)" }}
          >
            Sample #{i + 1}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe the issue — location, what's wrong, how long it's been happening..."
          rows={5}
          style={{
            width: "100%",
            fontFamily: "var(--font-body)",
            fontSize: 15,
            padding: 14,
            border: "1px solid var(--line)",
            borderRadius: 8,
            resize: "vertical",
            marginBottom: 16,
          }}
        />

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
              color: "var(--muted)",
              cursor: "pointer",
              border: "1px dashed var(--line)",
              padding: "8px 14px",
              borderRadius: 8,
            }}
          >
            📷 {photoFile ? photoFile.name : "Attach photo evidence (optional)"}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
          </label>
          {photoPreview && (
            <img src={photoPreview} alt="preview" style={{ display: "block", marginTop: 10, maxHeight: 140, borderRadius: 8, border: "1px solid var(--line)" }} />
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CHANNELS.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setChannel(c.id)}
                className="pill"
                style={{
                  cursor: "pointer",
                  border: "1px solid var(--line)",
                  background: channel === c.id ? "var(--ink)" : "#fff",
                  color: channel === c.id ? "#fff" : "var(--muted)",
                }}
              >
                {c.label}
              </button>
            ))}
            <button type="button" onClick={startVoice} className="pill" style={{ cursor: "pointer", border: "1px solid var(--line)", background: listening ? "var(--signal)" : "#fff", color: listening ? "#fff" : "var(--muted)" }}>
              {listening ? "Listening…" : "🎙 Speak"}
            </button>
          </div>

          <button type="submit" className="btn btn-signal" disabled={status === "loading"}>
            {status === "loading" ? "Classifying…" : "Submit complaint"}
          </button>
        </div>
      </form>

      {(status === "error" || status === "ratelimited") && (
        <p style={{ color: "#b8391a", marginTop: 16, fontSize: 14 }}>{errorMsg}</p>
      )}

      {result && (
        <div className="card" style={{ padding: 22, marginTop: 22, background: "#fbfaf6" }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>AI CLASSIFICATION RESULT</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            <span className={`pill pill-${result.category}`}>{result.category}</span>
            <span className={`pill pill-${result.urgency}`}>{result.urgency} urgency</span>
            <span className="pill" style={{ background: "#eee", color: "#555" }}>{result.language}</span>
            <span className="pill" style={{ background: "#eee", color: "#555" }}>{result.channel}</span>
            {result.isDuplicate && (
              <span className="pill" style={{ background: "#e6efe9", color: "#2c6b4f" }}>
                merged with existing issue ({result.similarityToCluster}% similar)
              </span>
            )}
          </div>
          {result.regionId ? (
            <p style={{ fontSize: 14, color: "var(--muted)" }}>
              Matched district: <strong style={{ color: "var(--ink)" }}>{result.regionId}</strong>
            </p>
          ) : (
            <p style={{ fontSize: 14, color: "var(--muted)" }}>No district explicitly mentioned — geotagging would use submitter location in production.</p>
          )}
          {result.translatedText && result.translatedText !== result.text && (
            <p style={{ fontSize: 14, marginTop: 10 }}>
              <span style={{ color: "var(--muted)" }}>Translation: </span>
              {result.translatedText}
            </p>
          )}
          {result.photoObservation && (
            <p style={{ fontSize: 14, marginTop: 10 }}>
              <span style={{ color: "var(--muted)" }}>Photo analysis: </span>
              {result.photoObservation}
            </p>
          )}
          <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 14, fontFamily: "var(--font-mono)" }}>
            classifier: {result.confidence === "gemini" ? "Gemini 2.0 Flash (live)" : "rule-based fallback — set GEMINI_API_KEY for live Gemini classification"}
          </p>
        </div>
      )}
    </main>
  );
}
