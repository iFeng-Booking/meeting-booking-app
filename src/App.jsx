import React, { useState } from "react";
import { Monitor, Smartphone, Tv } from "lucide-react";
import PCApp from "./PCApp.jsx";
import MobileApp from "./MobileApp.jsx";
import KioskApp from "./KioskApp.jsx";

const INK = "#16233A";
const SLATE = "#5B6B82";
const LINE = "#E3E8EF";
const BRAND = "#2452C8";

// change this to your own secret word — add ?admin=YOUR_WORD to the URL to unlock
// the full view (admin backend + mobile/kiosk demo tabs)
const ADMIN_SECRET = "ifeng2026";

export default function App() {
  const [tab, setTab] = useState("pc");
  const params = new URLSearchParams(window.location.search);
  const isAdmin = params.get("admin") === ADMIN_SECRET;
  const view = params.get("view"); // "kiosk" -> dedicated door-display link, no nav bar

  if (view === "kiosk") {
    return (
      <div style={{ fontFamily: "-apple-system,'PingFang SC','Microsoft YaHei',sans-serif" }}>
        <KioskApp fixedSpaceId={params.get("space")} />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={{ fontFamily: "-apple-system,'PingFang SC','Microsoft YaHei',sans-serif" }}>
        <PCApp publicMode />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "-apple-system,'PingFang SC','Microsoft YaHei',sans-serif" }}>
      <div style={{
        display: "flex", justifyContent: "center", gap: 6, padding: "10px 12px",
        background: "#fff", borderBottom: `1px solid ${LINE}`, position: "sticky", top: 0, zIndex: 500,
      }}>
        {[
          { key: "pc", label: "电脑预约 / 后台管理", icon: Monitor },
          { key: "mobile", label: "手机端演示", icon: Smartphone },
          { key: "kiosk", label: "门口智慧屏演示", icon: Tv },
        ].map(t => {
          const active = tab === t.key;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 999,
              border: `1px solid ${active ? BRAND : LINE}`, background: active ? BRAND : "#fff",
              color: active ? "#fff" : SLATE, fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}>
              <t.icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "pc" && <PCApp />}
      {tab === "mobile" && <MobileApp />}
      {tab === "kiosk" && <KioskApp />}
    </div>
  );
}
