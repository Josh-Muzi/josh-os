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
        backgroundColor: "#0E7A5F",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#C0C0C0",
          padding: 10,
          boxShadow: "10px 10px 0 rgba(0,0,0,0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            backgroundColor: "#000080",
            color: "#FFFFFF",
            padding: "12px 22px",
            fontSize: 30,
          }}
        >
          JoshOS
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#C0C0C0",
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
