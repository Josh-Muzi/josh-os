import { ImageResponse } from "next/og";

export const alt = "JoshOS — Josh Muzi, Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#9CBF87",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#FFFFFF",
          borderRadius: 24,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            backgroundColor: "#F5F5F4",
            color: "#1C1C1A",
            padding: "16px 26px",
            fontSize: 28,
            borderBottom: "1px solid #E7E5E4",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 18,
              height: 18,
              backgroundColor: "#2F9E44",
              borderRadius: 4,
            }}
          />
          JoshOS
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#FFFFFF",
            padding: "34px 56px",
          }}
        >
          <div style={{ fontSize: 68, fontWeight: 700, color: "#111111" }}>
            Josh Muzi
          </div>
          <div style={{ fontSize: 32, color: "#222222", marginTop: 10 }}>
            Software Engineer — TypeScript · React · Next.js
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
