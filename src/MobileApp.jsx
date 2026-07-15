import React, { useState, useEffect } from "react";
import {
  Home, ClipboardList, Bell, ChevronLeft, ChevronRight, Plus, X, Check,
  Building2, UtensilsCrossed, Presentation, MapPin, Users, Clock, QrCode,
  TimerReset, DoorOpen, LogIn, Search, Loader2
} from "lucide-react";

/* ---------------------------- design tokens ---------------------------- */
const INK = "#16233A";
const SLATE = "#5B6B82";
const LINE = "#E6EAF0";
const CANVAS = "#F4F6F9";
const BRAND = "#2452C8";

const TYPE_META = {
  会议室: { color: "#2452C8", soft: "#EBF0FE", icon: Building2 },
  宴会厅: { color: "#B5460B", soft: "#FCEEE4", icon: UtensilsCrossed },
  多功能厅: { color: "#6E3FA3", soft: "#F1E9FA", icon: Presentation },
};
const STATUS_META = {
  pending: { label: "待审批", color: "#B5460B", soft: "#FCEEE4" },
  confirmed: { label: "已确认", color: "#2452C8", soft: "#EBF0FE" },
  ongoing: { label: "进行中", color: "#0E8A5F", soft: "#E4F5EE" },
  ended: { label: "已结束", color: "#8A93A3", soft: "#F0F1F3" },
  cancelled: { label: "已取消", color: "#B3261E", soft: "#FBEAEA" },
};
const CURRENT_USER = { name: "李婷", dept: "行政部" };

function todayStr() { return new Date().toISOString().slice(0, 10); }
function uid() { return Math.random().toString(36).slice(2, 9); }
function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(":").map(Number);
  let total = Math.min(h * 60 + m + mins, 22 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}
function timeToMin(hhmm) { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; }

const today = todayStr();
const initialSpaces = [
  { id: "s1", name: "启明会议室", type: "会议室", floor: "3F", capacity: 8, equip: ["投影", "视频会议"] },
  { id: "s2", name: "远见会议室", type: "会议室", floor: "3F", capacity: 16, equip: ["投影", "白板"] },
  { id: "s3", name: "汇思会议室", type: "会议室", floor: "5F", capacity: 6, equip: ["电视屏"] },
  { id: "s4", name: "云顶宴会厅", type: "宴会厅", floor: "1F", capacity: 120, equip: ["舞台", "音响"] },
  { id: "s5", name: "翠湖宴会厅", type: "宴会厅", floor: "1F", capacity: 60, equip: ["音响"] },
  { id: "s6", name: "星空多功能厅（可分区）", type: "多功能厅", floor: "2F", capacity: 200, equip: ["音响", "灯光", "直播"] },
];
const initialBookings = [
  { id: uid(), spaceId: "s1", title: "产品周会", date: today, start: "09:30", end: "10:30", organizer: "王凯", dept: "研发部", people: 6, status: "ended", checkedIn: true },
  { id: uid(), spaceId: "s2", title: "季度经营复盘", date: today, start: "11:00", end: "12:30", organizer: CURRENT_USER.name, dept: CURRENT_USER.dept, people: 12, status: "ongoing", checkedIn: true },
  { id: uid(), spaceId: "s4", title: "年度客户答谢晚宴", date: today, start: "18:00", end: "21:00", organizer: CURRENT_USER.name, dept: CURRENT_USER.dept, people: 90, status: "pending", checkedIn: false, catering: { count: 90, standard: "商务标准（¥168/位）", table: "圆桌 10 人/桌" } },
];

import { fetchSpaces, fetchBookings, insertBooking, patchBooking } from "./db.js";

/* -------------------------------- helpers -------------------------------- */
function Badge({ status }) {
  const m = STATUS_META[status];
  return <span style={{ fontSize: 11, fontWeight: 700, color: m.color, background: m.soft, padding: "3px 8px", borderRadius: 6 }}>{m.label}</span>;
}
function Chip({ active, children, onClick, color }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap",
      border: `1px solid ${active ? (color || BRAND) : LINE}`, background: active ? (color || BRAND) : "#fff",
      color: active ? "#fff" : SLATE, cursor: "pointer",
    }}>{children}</button>
  );
}
function ActionBtn({ color, icon: Icon, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
      padding: "9px 0", borderRadius: 8, border: `1px solid ${color}33`, background: "#fff",
      color, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
    }}><Icon size={13} /> {children}</button>
  );
}
function TopBar({ title, onBack, right }) {
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 20, background: "#fff", borderBottom: `1px solid ${LINE}`,
      padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 22 }}>
        {onBack && <button onClick={onBack} style={{ border: "none", background: "none", cursor: "pointer", color: INK, padding: 0, display: "flex" }}><ChevronLeft size={20} /></button>}
        <div style={{ fontWeight: 800, fontSize: 16, color: INK }}>{title}</div>
      </div>
      {right}
    </div>
  );
}

/* ------------------------------- new booking ------------------------------ */
function NewBookingScreen({ space, defaultDate, onBack, onSubmit }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("11:00");
  const [people, setPeople] = useState(space.type === "会议室" ? 4 : 20);
  const [cateringCount, setCateringCount] = useState(20);
  const [standard, setStandard] = useState("商务标准（¥168/位）");
  const [table, setTable] = useState("圆桌 10 人/桌");
  const [partitions, setPartitions] = useState([]);
  const [av, setAv] = useState([]);
  const [error, setError] = useState("");

  const allPartitions = ["A区", "B区", "整场"];
  const allAv = ["音响", "灯光", "投影", "直播"];
  function toggle(list, setList, v) { setList(list.includes(v) ? list.filter(x => x !== v) : [...list, v]); }

  const label = { fontSize: 12, fontWeight: 700, color: SLATE, margin: "16px 0 6px" };
  const input = { width: "100%", padding: "11px 12px", borderRadius: 9, border: `1px solid ${LINE}`, fontSize: 14.5, color: INK, boxSizing: "border-box", background: "#fff" };

  function submit() {
    if (!title.trim()) return setError("请填写会议/活动主题");
    if (timeToMin(end) <= timeToMin(start)) return setError("结束时间需晚于开始时间");
    const needsApproval = space.type !== "会议室";
    onSubmit({
      id: uid(), spaceId: space.id, title, date, start, end,
      organizer: CURRENT_USER.name, dept: CURRENT_USER.dept, people: Number(people),
      status: needsApproval ? "pending" : "confirmed", checkedIn: false,
      ...(space.type === "宴会厅" ? { catering: { count: Number(cateringCount), standard, table } } : {}),
      ...(space.type === "多功能厅" ? { partitions, av } : {}),
    });
  }

  return (
    <div style={{ minHeight: "100%", background: CANVAS }}>
      <TopBar title="新建预约" onBack={onBack} />
      <div style={{ padding: "4px 16px 100px" }}>
        <div style={{ fontSize: 13, color: SLATE, margin: "12px 0 4px" }}>{space.name} · {space.type} · {space.floor}</div>

        <div style={label}>主题</div>
        <input style={input} value={title} onChange={e => setTitle(e.target.value)} placeholder="例如：Q3 产品评审会" />

        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><div style={label}>日期</div><input type="date" style={input} value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><div style={label}>开始</div><input type="time" style={input} value={start} onChange={e => setStart(e.target.value)} /></div>
          <div style={{ flex: 1 }}><div style={label}>结束</div><input type="time" style={input} value={end} onChange={e => setEnd(e.target.value)} /></div>
        </div>

        <div style={label}>参加人数</div>
        <input type="number" style={input} value={people} onChange={e => setPeople(e.target.value)} min={1} max={space.capacity} />

        {space.type === "宴会厅" && (
          <>
            <div style={label}>用餐人数</div>
            <input type="number" style={input} value={cateringCount} onChange={e => setCateringCount(e.target.value)} />
            <div style={label}>餐饮标准</div>
            <select style={input} value={standard} onChange={e => setStandard(e.target.value)}>
              <option>经济标准（¥98/位）</option><option>商务标准（¥168/位）</option><option>高端标准（¥298/位）</option>
            </select>
            <div style={label}>桌型摆台</div>
            <select style={input} value={table} onChange={e => setTable(e.target.value)}>
              <option>圆桌 10 人/桌</option><option>长桌会议式</option><option>自助餐式</option>
            </select>
          </>
        )}

        {space.type === "多功能厅" && (
          <>
            <div style={label}>场地分区</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {allPartitions.map(pt => <Chip key={pt} active={partitions.includes(pt)} onClick={() => toggle(partitions, setPartitions, pt)} color="#6E3FA3">{pt}</Chip>)}
            </div>
            <div style={label}>设备需求</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {allAv.map(a => <Chip key={a} active={av.includes(a)} onClick={() => toggle(av, setAv, a)} color="#6E3FA3">{a}</Chip>)}
            </div>
          </>
        )}

        {error && <div style={{ color: "#B3261E", fontSize: 12.5, marginTop: 14 }}>{error}</div>}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 430, margin: "0 auto", background: "#fff", borderTop: `1px solid ${LINE}`, padding: 14 }}>
        <button onClick={submit} style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: BRAND, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer" }}>
          {space.type === "会议室" ? "确认预约" : "提交审批"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ space detail ------------------------------ */
function SpaceDetailScreen({ space, date, setDate, bookings, onBack, onNew }) {
  const meta = TYPE_META[space.type];
  const dayBookings = bookings.filter(b => b.spaceId === space.id && b.date === date && b.status !== "cancelled").sort((a, b) => timeToMin(a.start) - timeToMin(b.start));

  return (
    <div style={{ minHeight: "100%", background: CANVAS, paddingBottom: 90 }}>
      <TopBar title={space.name} onBack={onBack} />
      <div style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: meta.soft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <meta.icon size={20} color={meta.color} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, color: SLATE, display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {space.floor}</div>
            <div style={{ fontSize: 12.5, color: SLATE, display: "flex", alignItems: "center", gap: 4 }}><Users size={12} /> 容纳 {space.capacity} 人</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
          {space.equip.map(e => <span key={e} style={{ fontSize: 11.5, color: SLATE, background: "#fff", border: `1px solid ${LINE}`, padding: "3px 9px", borderRadius: 6 }}>{e}</span>)}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <Clock size={14} color={SLATE} />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ border: `1px solid ${LINE}`, borderRadius: 7, padding: "6px 9px", fontSize: 12.5, background: "#fff" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {dayBookings.length === 0 && <div style={{ fontSize: 13, color: SLATE, background: "#fff", padding: 14, borderRadius: 10, border: `1px solid ${LINE}` }}>当日暂无预约，空间空闲。</div>}
          {dayBookings.map(b => (
            <div key={b.id} style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: INK }}>{b.title}</div>
                <Badge status={b.status} />
              </div>
              <div style={{ fontSize: 12, color: SLATE }}>{b.start}–{b.end} · {b.organizer}（{b.dept}）</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 430, margin: "0 auto", background: "#fff", borderTop: `1px solid ${LINE}`, padding: 14 }}>
        <button onClick={onNew} style={{ width: "100%", padding: "13px 0", borderRadius: 10, border: "none", background: BRAND, color: "#fff", fontWeight: 800, fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Plus size={16} /> 新建预约
        </button>
      </div>
    </div>
  );
}

/* --------------------------------- home tab -------------------------------- */
function HomeTab({ spaces, bookings, date, setDate, onOpenSpace }) {
  const [typeFilter, setTypeFilter] = useState("全部");
  const [q, setQ] = useState("");
  const filtered = spaces.filter(s => (typeFilter === "全部" || s.type === typeFilter) && s.name.includes(q));

  function countToday(id) { return bookings.filter(b => b.spaceId === id && b.date === date && b.status !== "cancelled").length; }

  return (
    <div style={{ paddingBottom: 90 }}>
      <TopBar title="智慧空间预约" right={<Bell size={19} color={SLATE} />} />
      <div style={{ padding: "12px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10, padding: "9px 12px", marginBottom: 12 }}>
          <Search size={15} color={SLATE} />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="搜索会议室 / 宴会厅 / 多功能厅" style={{ border: "none", outline: "none", fontSize: 13.5, flex: 1, background: "transparent" }} />
        </div>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10 }}>
          {["全部", "会议室", "宴会厅", "多功能厅"].map(t => (
            <Chip key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)} color={t !== "全部" ? TYPE_META[t].color : undefined}>{t}</Chip>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 12.5, color: SLATE }}>查看日期</span>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ border: `1px solid ${LINE}`, borderRadius: 7, padding: "5px 9px", fontSize: 12.5, background: "#fff" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(s => {
            const meta = TYPE_META[s.type];
            const n = countToday(s.id);
            return (
              <div key={s.id} onClick={() => onOpenSpace(s)} style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: meta.soft, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <meta.icon size={21} color={meta.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontWeight: 800, fontSize: 14.5, color: INK }}>{s.name}</div>
                    <ChevronRight size={16} color="#B7BEC9" />
                  </div>
                  <div style={{ fontSize: 12, color: SLATE, margin: "2px 0 5px" }}>{s.floor} · 容纳 {s.capacity} 人</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: n > 0 ? "#B5460B" : "#0E8A5F" }}>{n > 0 ? `今日已订 ${n} 场` : "今日空闲"}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- mine tab --------------------------------- */
function MineTab({ bookings, spaces, act }) {
  const mine = bookings.filter(b => b.organizer === CURRENT_USER.name).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).reverse();
  return (
    <div style={{ paddingBottom: 90 }}>
      <TopBar title="我的预约" />
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, marginBottom: 4 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: BRAND, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
            {CURRENT_USER.name[0]}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14.5, color: INK }}>{CURRENT_USER.name}</div>
            <div style={{ fontSize: 12, color: SLATE }}>{CURRENT_USER.dept}</div>
          </div>
        </div>

        {mine.length === 0 && <div style={{ fontSize: 13, color: SLATE }}>暂无预约记录。</div>}
        {mine.map(b => {
          const sp = spaces.find(s => s.id === b.spaceId);
          return (
            <div key={b.id} style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: INK }}>{b.title}</div>
                <Badge status={b.status} />
              </div>
              <div style={{ fontSize: 12, color: SLATE, marginBottom: 10 }}>{sp?.name} · {b.date} {b.start}–{b.end} · {b.people}人{b.checkedIn ? " · 已签到" : ""}</div>
              <div style={{ display: "flex", gap: 6 }}>
                {(b.status === "confirmed" || b.status === "ongoing") && !b.checkedIn && (
                  <ActionBtn color="#0E8A5F" icon={LogIn} onClick={() => act(b.id, x => ({ ...x, checkedIn: true, status: "ongoing" }), "签到成功")}>签到</ActionBtn>
                )}
                {(b.status === "confirmed" || b.status === "ongoing") && (
                  <>
                    <ActionBtn color={BRAND} icon={TimerReset} onClick={() => act(b.id, x => ({ ...x, end: addMinutes(x.end, 30) }), "已延长 30 分钟")}>延长</ActionBtn>
                    <ActionBtn color="#8A93A3" icon={DoorOpen} onClick={() => act(b.id, x => ({ ...x, status: "ended" }), "已提前结束")}>结束</ActionBtn>
                  </>
                )}
                {b.status === "pending" && (
                  <ActionBtn color="#B3261E" icon={X} onClick={() => act(b.id, x => ({ ...x, status: "cancelled" }), "已取消")}>取消</ActionBtn>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------------- toast ---------------------------------- */
function Toast({ text }) {
  if (!text) return null;
  return (
    <div style={{ position: "absolute", bottom: 78, left: "50%", transform: "translateX(-50%)", background: INK, color: "#fff", padding: "10px 18px", borderRadius: 10, fontSize: 12.5, zIndex: 200, whiteSpace: "nowrap" }}>
      {text}
    </div>
  );
}

/* --------------------------------- root ---------------------------------- */
export default function MobileApp() {
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState("list"); // list | detail | new
  const [activeSpace, setActiveSpace] = useState(null);
  const [date, setDate] = useState(today);
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [s, b] = await Promise.all([fetchSpaces(), fetchBookings()]);
        setSpaces(s); setBookings(b);
      } catch (e) {
        notify("加载失败，请检查网络");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  function notify(msg) { setToast(msg); setTimeout(() => setToast(""), 2600); }

  function act(id, updater, msg) {
    let updated = null;
    setBookings(prev => prev.map(b => {
      if (b.id !== id) return b;
      updated = updater(b);
      return updated;
    }));
    notify(msg);
    if (updated) patchBooking(id, updated).catch(() => notify("同步失败，请检查网络"));
  }

  function submitBooking(b) {
    setBookings(prev => [...prev, b]);
    setScreen("list"); setActiveSpace(null); setTab("mine");
    notify(b.status === "confirmed" ? "预约成功，已自动通知参会人" : "已提交审批，通过后自动通知");
    insertBooking(b).catch(() => notify("保存到服务器失败，请检查网络"));
  }

  let body;
  if (screen === "new" && activeSpace) {
    body = <NewBookingScreen space={activeSpace} defaultDate={date} onBack={() => setScreen("detail")} onSubmit={submitBooking} />;
  } else if (screen === "detail" && activeSpace) {
    body = <SpaceDetailScreen space={activeSpace} date={date} setDate={setDate} bookings={bookings} onBack={() => { setScreen("list"); setActiveSpace(null); }} onNew={() => setScreen("new")} />;
  } else if (tab === "home") {
    body = <HomeTab spaces={spaces} bookings={bookings} date={date} setDate={setDate} onOpenSpace={s => { setActiveSpace(s); setScreen("detail"); }} />;
  } else if (tab === "mine") {
    body = <MineTab bookings={bookings} spaces={spaces} act={act} />;
  } else if (tab === "scan") {
    body = (
      <div style={{ padding: 16 }}>
        <TopBar title="扫码签到" />
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: SLATE }}>
          <div style={{ width: 160, height: 160, borderRadius: 16, border: `2px dashed ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <QrCode size={64} color="#B7BEC9" />
          </div>
          <div style={{ fontSize: 13, textAlign: "center", lineHeight: 1.6 }}>对准会议室门口的签到二维码<br />完成快速签到</div>
        </div>
      </div>
    );
  }

  const navItems = [
    { key: "home", label: "空间预约", icon: Home },
    { key: "scan", label: "扫码签到", icon: QrCode },
    { key: "mine", label: "我的预约", icon: ClipboardList },
  ];

  if (!loaded) {
    return (
      <div style={{ display: "flex", justifyContent: "center", background: "#DCE1E8", minHeight: "100vh" }}>
        <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", background: CANVAS, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: SLATE, fontSize: 13 }}>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin-icon { animation: spin 1s linear infinite; }`}</style>
          <Loader2 size={15} className="spin-icon" /> 正在加载…
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", background: "#DCE1E8", minHeight: "100vh", fontFamily: "-apple-system,'PingFang SC','Microsoft YaHei',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 430, minHeight: "100vh", background: CANVAS, position: "relative", boxShadow: "0 0 40px rgba(0,0,0,0.08)" }}>
        {body}

        {screen === "list" && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, maxWidth: 430, margin: "0 auto", background: "#fff", borderTop: `1px solid ${LINE}`, display: "flex", padding: "8px 0 12px" }}>
            {navItems.map(it => {
              const active = tab === it.key;
              return (
                <button key={it.key} onClick={() => setTab(it.key)} style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  border: "none", background: "none", cursor: "pointer", color: active ? BRAND : "#9AA4B2",
                }}>
                  <it.icon size={19} />
                  <span style={{ fontSize: 10.5, fontWeight: 700 }}>{it.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <Toast text={toast} />
      </div>
    </div>
  );
}
