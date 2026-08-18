"use client";

import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";

const CATEGORY_COLOR = {
  water: "#1c5a85",
  roads: "#5b3b8c",
  electricity: "#8a6d0a",
  healthcare: "#a02c2c",
  sanitation: "#226354",
  other: "#555",
};

export default function ComplaintMap({ hotspots }) {
  const center = [20.9, 78.0];
  const maxScore = Math.max(1, ...hotspots.map((h) => h.priorityScore));

  return (
    <MapContainer center={center} zoom={7} style={{ height: 420, width: "100%", borderRadius: 12 }} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {hotspots.map((h, i) => {
        if (!h.lat || !h.lng) return null;
        const radius = 8 + (h.priorityScore / maxScore) * 22;
        return (
          <CircleMarker
            key={i}
            center={[h.lat, h.lng]}
            radius={radius}
            pathOptions={{
              color: CATEGORY_COLOR[h.category] || "#555",
              fillColor: CATEGORY_COLOR[h.category] || "#555",
              fillOpacity: 0.45,
              weight: 2,
            }}
          >
            <Tooltip direction="top">
              <div style={{ fontFamily: "sans-serif", fontSize: 12.5 }}>
                <strong>{h.regionName}</strong> — {h.category}
                <br />
                {h.complaintCount} complaint(s) · priority score {h.priorityScore}
                <br />
                infra index {h.infraIndex}/100 · ₹{h.currentInvestmentINRLakh}L invested
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
