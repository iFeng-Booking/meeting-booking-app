import React, { useState, useMemo, useEffect } from "react";
import {
  CheckCircle2, Clock3, Users, MapPin, QrCode, TimerReset, DoorOpen,
  CalendarClock, Building2, UtensilsCrossed, Presentation, AlertTriangle, Plus, X, Loader2
} from "lucide-react";
import { fetchSpaces, fetchBookings, insertBooking, patchBooking } from "./db.js";

/* ---------------------------- design tokens ---------------------------- */
/* Concept: a wall-mounted room-status panel, styled like an airport gate /
   departure board — tabular-numeral clock, traffic-light status color
   (green free / amber starting soon / red in use), high contrast for
   readability from a distance. */
const BG = "#0A0F1C";
const PANEL = "#111A2C";
const LINE = "rgba(255,255,255,0.09)";
const TXT = "#F3F6FB";
const SUB = "#8C9BB5";
const MONO = "ui-monospace, 'SF Mono', 'Roboto Mono', Consolas, monospace";
const SANS = "-apple-system, 'PingFang SC', 'Microsoft YaHei', sans-serif";

const STATE_META = {
  free: { color: "#22C55E", glow: "rgba(34,197,94,0.16)", label: "空闲 · 可预约" },
  soon: { color: "#F59E0B", glow: "rgba(245,158,11,0.18)", label: "即将开始" },
  busy: { color: "#EF4444", glow: "rgba(239,68,68,0.18)", label: "使用中" },
};

const TYPE_META = {
  会议室: { icon: Building2 },
  宴会厅: { icon: UtensilsCrossed },
  多功能厅: { icon: Presentation },
};

function uid() { return Math.random().toString(36).slice(2, 9); }
function timeToMin(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }
function minToTime(total) {
  total = Math.max(0, Math.min(23 * 60 + 59, total));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function addMinutes(hhmm, mins) { return minToTime(timeToMin(hhmm) + mins); }
function todayStr() { return new Date().toISOString().slice(0, 10); }
const WEEKDAYS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const today = todayStr();

const NOTICES = [
  "本周五 18:00 云顶宴会厅将举办年度客户答谢晚宴，请相关同事提前布置",
  "会议室使用请遵守企业空间管理规范，离场请及时签退释放资源",
  "星空多功能厅本周六进行设备例行检修，暂停对外预约",
];

/* ------------------------------- sub views -------------------------------- */
function Marquee({ items }) {
  return (
    <div style={{ overflow: "hidden", whiteSpace: "nowrap", position: "relative", height: "100%", display: "flex", alignItems: "center" }}>
      <div className="marquee-track" style={{ display: "inline-block", paddingLeft: "100%" }}>
        {items.map((t, i) => (
          <span key={i} style={{ marginRight: 60, fontSize: 13.5, color: SUB }}>
            <span style={{ color: "#F59E0B", fontWeight: 800, marginRight: 8 }}>通知</span>{t}
          </span>
        ))}
      </div>
    </div>
  );
}

function TempBookingModal({ space, simTime, onCancel, onSubmit }) {
  const [title, setTitle] = useState("");
  const [dur, setDur] = useState(30);
  const [organizer, setOrganizer] = useState("");
  const [error, setError] = useState("");

  function submit() {
    if (!title.trim()) return setError("请填写会议主题");
    if (!organizer.trim()) return setError("请填写预约人姓名");
    onSubmit({ id: uid(), spaceId: space.id, title, organizer, dept: "现场预约", date: todayStr(), start: simTime, end: addMinutes(simTime, dur), status: "confirmed", checkedIn: false });
  }

  const input = { width: "100%", padding: "14px 16px", borderRadius: 10, border: `1px solid ${LINE}`, background: "#0E1626", color: TXT, fontSize: 18, boxSizing: "border-box" };
  const label = { fontSize: 13, fontWeight: 700, color: SUB, margin: "18px 0 8px", display: "block" };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(4,7,14,0.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, borderRadius: 20 }}>
      <div style={{ width: "72%", maxWidth: 460, background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: 26 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: TXT }}>现场发起临时预约</div>
          <button onClick={onCancel} style={{ border: "none", background: "none", color: SUB, cursor: "pointer" }}><X size={20} /></button>
        </div>
        <div style={{ fontSize: 13, color: SUB, marginBottom: 4 }}>{space.name} · 自 {simTime} 起</div>

        <label style={label}>会议主题</label>
        <input style={input} value={title} onChange={e => setTitle(e.target.value)} placeholder="例如：临时对齐会" />

        <label style={label}>预约人</label>
        <input style={input} value={organizer} onChange={e => setOrganizer(e.target.value)} placeholder="姓名" />

        <label style={label}>使用时长</label>
        <div style={{ display: "flex", gap: 10 }}>
          {[30, 60, 90].map(d => (
            <button key={d} onClick={() => setDur(d)} style={{
              flex: 1, padding: "12px 0", borderRadius: 10, fontSize: 16, fontWeight: 800, cursor: "pointer",
              border: `1px solid ${dur === d ? "#22C55E" : LINE}`, background: dur === d ? "rgba(34,197,94,0.15)" : "#0E1626",
              color: dur === d ? "#22C55E" : TXT,
            }}>{d}分钟</button>
          ))}
        </div>

        {error && <div style={{ color: "#F87171", fontSize: 13, marginTop: 14 }}>{error}</div>}

        <button onClick={submit} style={{ width: "100%", marginTop: 22, padding: "15px 0", borderRadius: 10, border: "none", background: "#22C55E", color: "#06210F", fontWeight: 800, fontSize: 17, cursor: "pointer" }}>
          确认预约并占用空间
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- root ----------------------------------- */
export default function KioskApp() {
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [spaceId, setSpaceId] = useState(null);
  const [simTime, setSimTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [showTemp, setShowTemp] = useState(false);
  const [toast, setToast] = useState("");
  const [checkedIn, setCheckedIn] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [s, b] = await Promise.all([fetchSpaces(), fetchBookings()]);
        setSpaces(s);
        setBookings(b);
        if (s.length) setSpaceId(s[0].id);
      } catch (e) {
        setLoadError("加载失败，请检查网络");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  function notify(msg) { setToast(msg); setTimeout(() => setToast(""), 2400); }

  if (!loaded || !spaceId) {
    return (
      <div style={{ minHeight: "100vh", background: "#04070D", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: SUB, fontSize: 13, fontFamily: SANS }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin-icon { animation: spin 1s linear infinite; }`}</style>
        <Loader2 size={15} className="spin-icon" /> {loadError || "正在加载排期数据…"}
      </div>
    );
  }

  const space = spaces.find(s => s.id === spaceId);
  const dayList = bookings
    .filter(b => b.spaceId === spaceId && b.date === today && b.status !== "cancelled")
    .slice()
    .sort((a, b) => timeToMin(a.start) - timeToMin(b.start));

  const simMin = timeToMin(simTime);
  const current = dayList.find(b => b.status !== "ended" && simMin >= timeToMin(b.start) && simMin < timeToMin(b.end));
  const upcoming = dayList
    .filter(b => b.status !== "ended" && timeToMin(b.start) > simMin)
    .sort((a, b) => timeToMin(a.start) - timeToMin(b.start))[0];

  const state = current ? "busy" : (upcoming && timeToMin(upcoming.start) - simMin <= 15) ? "soon" : "free";
  const meta = STATE_META[state];
  const TypeIcon = TYPE_META[space.type].icon;

  function updateBooking(id, updater) {
    let updated = null;
    setBookings(prev => prev.map(b => {
      if (b.id !== id) return b;
      updated = updater(b);
      return updated;
    }));
    if (updated) patchBooking(id, updated).catch(() => notify("同步失败，请检查网络"));
  }
  function addTempBooking(b) {
    setBookings(prev => [...prev, b]);
    setShowTemp(false);
    notify("已占用空间，祝会议顺利");
    insertBooking(b).catch(() => notify("保存到服务器失败，请检查网络"));
  }

  const now = new Date();
  const dateLabel = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${WEEKDAYS[now.getDay()]}`;

  return (
    <div style={{ minHeight: "100vh", background: "#04070D", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px", fontFamily: SANS }}>
      <style>{`
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-100%); } }
        .marquee-track { animation: marquee 22s linear infinite; }
        @keyframes pulseDot { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
      `}</style>

      {/* device selector — demo aid only, a real installation is one screen per door */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {spaces.map(s => (
          <button key={s.id} onClick={() => setSpaceId(s.id)} style={{
            padding: "6px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
            border: `1px solid ${spaceId === s.id ? "#3B82F6" : LINE}`,
            background: spaceId === s.id ? "rgba(59,130,246,0.15)" : "transparent",
            color: spaceId === s.id ? "#93C5FD" : SUB,
          }}>{s.name}</button>
        ))}
      </div>

      {/* the physical panel */}
      <div style={{
        width: "100%", maxWidth: 1080, aspectRatio: "16/9", background: PANEL, borderRadius: 22,
        border: `1px solid ${LINE}`, boxShadow: "0 30px 80px rgba(0,0,0,0.5)", position: "relative",
        overflow: "hidden", display: "flex", flexDirection: "column",
      }}>
        {/* top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 30px 14px", borderBottom: `1px solid ${LINE}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TypeIcon size={22} color={TXT} />
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: TXT }}>{space.name}</div>
              <div style={{ fontSize: 12.5, color: SUB, display: "flex", gap: 12, marginTop: 2 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {space.floor}</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Users size={12} /> 容纳 {space.capacity} 人</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 700, color: TXT, lineHeight: 1 }}>{simTime}</div>
            <div style={{ fontSize: 12, color: SUB, marginTop: 4 }}>{dateLabel}</div>
          </div>
        </div>

        {/* main content */}
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          {/* status hero */}
          <div style={{
            flex: 1.35, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: 24, background: `radial-gradient(ellipse at 50% 30%, ${meta.glow}, transparent 70%)`,
            borderRight: `1px solid ${LINE}`, position: "relative",
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 18px", borderRadius: 999,
              background: `${meta.color}22`, border: `1px solid ${meta.color}55`, marginBottom: 22,
            }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: meta.color, animation: "pulseDot 1.6s ease-in-out infinite" }} />
              <span style={{ color: meta.color, fontWeight: 800, fontSize: 15, letterSpacing: 1 }}>{meta.label}</span>
            </div>

            {current ? (
              <>
                <div style={{ fontSize: 26, fontWeight: 800, color: TXT, textAlign: "center", marginBottom: 8 }}>{current.title}</div>
                <div style={{ fontSize: 14, color: SUB, marginBottom: 22 }}>{current.organizer}（{current.dept}）· {current.start}–{current.end}</div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => { updateBooking(current.id, b => ({ ...b, end: addMinutes(b.end, 30) })); notify("已延长 30 分钟"); }} style={kioskBtn("#3B82F6")}>
                    <TimerReset size={16} /> 延长 30 分钟
                  </button>
                  <button onClick={() => { updateBooking(current.id, b => ({ ...b, status: "ended" })); notify("已提前结束，空间即将释放"); }} style={kioskBtn("#94A3B8")}>
                    <DoorOpen size={16} /> 提前结束
                  </button>
                </div>
              </>
            ) : state === "soon" ? (
              <>
                <div style={{ fontSize: 26, fontWeight: 800, color: TXT, textAlign: "center", marginBottom: 8 }}>{upcoming.title}</div>
                <div style={{ fontSize: 14, color: SUB, marginBottom: 4 }}>{upcoming.organizer}（{upcoming.dept}）</div>
                <div style={{ fontSize: 14, color: meta.color, fontWeight: 700 }}>{upcoming.start} 开始 · 还有 {timeToMin(upcoming.start) - simMin} 分钟</div>
              </>
            ) : (
              <>
                <CheckCircle2 size={54} color={meta.color} style={{ marginBottom: 10 }} />
                <div style={{ fontSize: 15, color: SUB, marginBottom: 20 }}>
                  {upcoming ? `下一场 ${upcoming.start} ${upcoming.title}` : "今日暂无预定"}
                </div>
                {space.type === "会议室" && (
                  <button onClick={() => setShowTemp(true)} style={kioskBtn("#22C55E", true)}>
                    <Plus size={17} /> 现场发起临时预约
                  </button>
                )}
              </>
            )}
          </div>

          {/* right column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "20px 22px", gap: 16, minHeight: 0 }}>
            <div style={{
              background: "rgba(255,255,255,0.03)", border: `1px solid ${LINE}`, borderRadius: 14,
              padding: 16, display: "flex", alignItems: "center", gap: 14, cursor: current ? "pointer" : "default",
            }} onClick={() => {
              if (current && !checkedIn[current.id]) {
                setCheckedIn(prev => ({ ...prev, [current.id]: true }));
                notify("签到成功");
                patchBooking(current.id, { checkedIn: true }).catch(() => notify("同步失败，请检查网络"));
              }
            }}>
              <div style={{ width: 56, height: 56, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <QrCode size={30} color="#111" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: TXT }}>扫码 / 刷卡签到</div>
                <div style={{ fontSize: 12, color: SUB, marginTop: 2 }}>
                  {current ? (checkedIn[current.id] ? "本场已签到" : "点击此区域模拟签到") : "暂无进行中的会议"}
                </div>
              </div>
            </div>

            <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${LINE}`, borderRadius: 14, padding: 16, overflowY: "auto", minHeight: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: SUB, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <CalendarClock size={13} /> 今日排期
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {dayList.length === 0 && <div style={{ fontSize: 12.5, color: SUB }}>今日暂无预约</div>}
                {dayList.map(b => {
                  const isCurrent = current && current.id === b.id;
                  const isPast = timeToMin(b.end) <= simMin || b.status === "ended";
                  return (
                    <div key={b.id} style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 9,
                      background: isCurrent ? `${meta.color}18` : "transparent",
                      border: `1px solid ${isCurrent ? meta.color + "55" : "transparent"}`,
                      opacity: isPast && !isCurrent ? 0.45 : 1,
                    }}>
                      <div style={{ fontFamily: MONO, fontSize: 12.5, color: TXT, width: 92, flexShrink: 0 }}>{b.start}–{b.end}</div>
                      <div style={{ fontSize: 12.5, color: TXT, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ticker */}
        <div style={{ height: 34, borderTop: `1px solid ${LINE}`, background: "rgba(255,255,255,0.02)", padding: "0 20px" }}>
          <Marquee items={NOTICES} />
        </div>

        {toast && (
          <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", background: "#111826", border: `1px solid ${LINE}`, color: TXT, padding: "8px 16px", borderRadius: 9, fontSize: 12.5, zIndex: 60, display: "flex", alignItems: "center", gap: 6 }}>
            <AlertTriangle size={13} color="#F59E0B" /> {toast}
          </div>
        )}

        {showTemp && <TempBookingModal space={space} simTime={simTime} onCancel={() => setShowTemp(false)} onSubmit={addTempBooking} />}
      </div>

      {/* demo time control — not part of the physical screen, lets you preview all states */}
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12, color: SUB, display: "flex", alignItems: "center", gap: 5 }}><Clock3 size={13} /> 演示：切换当前时间</span>
        {["08:50", "09:40", "11:20", "13:50", "15:45", "17:55"].map(t => (
          <button key={t} onClick={() => setSimTime(t)} style={{
            padding: "5px 11px", borderRadius: 7, fontSize: 12, fontFamily: MONO, cursor: "pointer",
            border: `1px solid ${simTime === t ? "#3B82F6" : LINE}`,
            background: simTime === t ? "rgba(59,130,246,0.15)" : "transparent",
            color: simTime === t ? "#93C5FD" : SUB,
          }}>{t}</button>
        ))}
      </div>
    </div>
  );
}

function kioskBtn(color, filled) {
  return {
    display: "flex", alignItems: "center", gap: 8, padding: "13px 22px", borderRadius: 11,
    border: filled ? "none" : `1px solid ${color}55`, background: filled ? color : `${color}18`,
    color: filled ? "#06210F" : color, fontWeight: 800, fontSize: 14.5, cursor: "pointer",
  };
}
