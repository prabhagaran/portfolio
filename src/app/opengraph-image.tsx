import { ImageResponse } from "next/og";
import { site } from "@/data/site";

export const alt = `${site.name} — ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          backgroundColor: "#0b0f14",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.18) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "monospace",
            fontSize: 22,
            letterSpacing: 4,
            color: "#10b981",
            textTransform: "uppercase",
          }}
        >
          Hardware · Firmware · PCB
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 72,
            fontWeight: 700,
            color: "#f8fafc",
            lineHeight: 1.1,
          }}
        >
          {site.name}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 16,
            fontSize: 40,
            fontWeight: 600,
            color: "#3b82f6",
          }}
        >
          {site.role}
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontSize: 26,
            color: "#94a3b8",
            maxWidth: 920,
            lineHeight: 1.5,
          }}
        >
          {site.tagline}
        </div>
      </div>
    ),
    { ...size }
  );
}
