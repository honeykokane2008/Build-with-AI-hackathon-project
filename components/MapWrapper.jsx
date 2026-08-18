"use client";

import dynamic from "next/dynamic";

const ComplaintMap = dynamic(() => import("./ComplaintMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 420,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--muted)",
        fontSize: 13,
      }}
    >
      Loading map…
    </div>
  ),
});

export default function MapWrapper(props) {
  return <ComplaintMap {...props} />;
}
