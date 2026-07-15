import React, { useState, useMemo, useEffect } from "react";
import {
  Calendar, Clock, Users, MapPin, Plus, Check, X, LayoutGrid, BarChart3,
  Settings, Bell, ChevronLeft, ChevronRight, UtensilsCrossed, Building2,
  Presentation, Trash2, Pencil, LogIn, TimerReset, DoorOpen, ClipboardList,
  Wifi, Projector, Mic2, Sofa, Loader2, RotateCcw
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

/* ---------------------------- design tokens ---------------------------- */
const INK = "#16233A";
const SLATE = "#5B6B82";
const LINE = "#E3E8EF";
const CANVAS = "#F4F6F9";
const CARD = "#FFFFFF";
const BRAND = "#2452C8";
const BRAND_SOFT = "#EBF0FE";

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

const DEPTS = ["行政部", "市场部", "研发部", "人力资源部", "销售部"];
const CURRENT_USER = { name: "李婷", dept: "行政部" };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function uid() {
  return Math.random().toString(36).slice(2, 9);
}
function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(":").map(Number);
  let total = h * 60 + m + mins;
  total = Math.min(total, 22 * 60);
  const nh = Math.floor(total / 60).toString().padStart(2, "0");
  const nm = (total % 60).toString().padStart(2, "0");
  return `${nh}:${nm}`;
}
function timeToMin(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/* ------------------------------ seed data ------------------------------ */
const initialSpaces = [
  { id: "s1", name: "启明会议室", type: "会议室", floor: "3F", capacity: 8, equip: ["投影", "视频会议"] },
  { id: "s2", name: "远见会议室", type: "会议室", floor: "3F", capacity: 16, equip: ["投影", "白板"] },
  { id: "s3", name: "汇思会议室", type: "会议室", floor: "5F", capacity: 6, equip: ["电视屏"] },
  { id: "s4", name: "云顶宴会厅", type: "宴会厅", floor: "1F", capacity: 120, equip: ["舞台", "音响"] },
  { id: "s5", name: "翠湖宴会厅", type: "宴会厅", floor: "1F", capacity: 60, equip: ["音响"] },
  { id: "s6", name: "星空多功能厅（可分区）", type: "多功能厅", floor: "2F", capacity: 200, equip: ["音响", "灯光", "直播"] },
];

const today = todayStr();
const initialBookings = [
  { id: uid(), spaceId: "s1", title: "产品周会", date: today, start: "09:30", end: "10:30", organizer: "王凯", dept: "研发部", people: 6, status: "ended", checkedIn: true },
  { id: uid(), spaceId: "s2", title: "季度经营复盘", date: today, start: "11:00", end: "12:30", organizer: "陈曦", dept: "市场部", people: 12, status: "ongoing", checkedIn: true },
  { id: uid(), spaceId: "s4", title: "年度客户答谢晚宴", date: today, start: "18:00", end: "21:00", organizer: "李婷", dept: "行政部", people: 90, status: "pending", checkedIn: false, catering: { count: 90, standard: "商务标准（¥168/位）", table: "圆桌 10 人/桌" } },
  { id: uid(), spaceId: "s6", title: "新品发布会", date: today, start: "14:00", end: "17:00", organizer: "赵敏", dept: "市场部", people: 150, status: "confirmed", checkedIn: false, partitions: ["A区", "B区"], av: ["音响", "灯光", "直播"] },
];

import { fetchSpaces, fetchBookings, insertBooking, patchBooking, insertSpace, patchSpace, deleteSpace } from "./db.js";

/* ------------------------------ small UI -------------------------------- */
function Pill({ active, children, onClick, color }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        border: `1px solid ${active ? (color || BRAND) : LINE}`,
        background: active ? (color || BRAND) : "#fff",
        color: active ? "#fff" : SLATE,
        cursor: "pointer",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  );
}

function Badge({ status }) {
  const m = STATUS_META[status];
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color: m.color, background: m.soft, padding: "3px 9px", borderRadius: 6 }}>
      {m.label}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 12, ...style }}>
      {children}
    </div>
  );
}

function Toast({ text }) {
  if (!text) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      background: INK, color: "#fff", padding: "12px 20px", borderRadius: 10,
      fontSize: 13, display: "flex", alignItems: "center", gap: 8, zIndex: 200,
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    }}>
      <Bell size={15} /> {text}
    </div>
  );
}

/* ------------------------------ booking form ----------------------------- */
function BookingForm({ space, defaultDate, onCancel, onSubmit }) {
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

  const allPartitions = ["A区", "B区", "整场（不分区）"];
  const allAv = ["音响", "灯光", "投影", "直播设备"];

  function toggle(list, setList, v) {
    setList(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
  }

  function submit() {
    if (!title.trim()) return setError("请填写会议/活动主题");
    if (timeToMin(end) <= timeToMin(start)) return setError("结束时间需晚于开始时间");
    const needsApproval = space.type !== "会议室";
    onSubmit({
      id: uid(),
      spaceId: space.id,
      title, date, start, end,
      organizer: CURRENT_USER.name,
      dept: CURRENT_USER.dept,
      people: Number(people),
      status: needsApproval ? "pending" : "confirmed",
      checkedIn: false,
      ...(space.type === "宴会厅" ? { catering: { count: Number(cateringCount), standard, table } } : {}),
      ...(space.type === "多功能厅" ? { partitions, av } : {}),
    });
  }

  const label = { fontSize: 12, fontWeight: 700, color: SLATE, marginBottom: 6, display: "block" };
  const input = { width: "100%", padding: "9px 11px", borderRadius: 8, border: `1px solid ${LINE}`, fontSize: 14, color: INK, boxSizing: "border-box" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,26,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 14, width: 460, maxHeight: "88vh", overflowY: "auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: INK }}>新建预约</div>
          <button onClick={onCancel} style={{ border: "none", background: "none", cursor: "pointer", color: SLATE }}><X size={18} /></button>
        </div>
        <div style={{ fontSize: 13, color: SLATE, marginBottom: 18 }}>{space.name} · {space.type} · {space.floor}</div>

        <label style={label}>主题</label>
        <input style={{ ...input, marginBottom: 14 }} value={title} onChange={e => setTitle(e.target.value)} placeholder="例如：Q3 产品评审会" />

        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={label}>日期</label>
            <input type="date" style={input} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>开始</label>
            <input type="time" style={input} value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>结束</label>
            <input type="time" style={input} value={end} onChange={e => setEnd(e.target.value)} />
          </div>
        </div>

        <label style={label}>参会/参加人数</label>
        <input type="number" style={{ ...input, marginBottom: 14 }} value={people} onChange={e => setPeople(e.target.value)} min={1} max={space.capacity} />

        {space.type === "宴会厅" && (
          <>
            <label style={label}>用餐人数</label>
            <input type="number" style={{ ...input, marginBottom: 14 }} value={cateringCount} onChange={e => setCateringCount(e.target.value)} />
            <label style={label}>餐饮标准</label>
            <select style={{ ...input, marginBottom: 14 }} value={standard} onChange={e => setStandard(e.target.value)}>
              <option>经济标准（¥98/位）</option>
              <option>商务标准（¥168/位）</option>
              <option>高端标准（¥298/位）</option>
            </select>
            <label style={label}>桌型摆台</label>
            <select style={{ ...input, marginBottom: 4 }} value={table} onChange={e => setTable(e.target.value)}>
              <option>圆桌 10 人/桌</option>
              <option>长桌会议式</option>
              <option>自助餐式</option>
            </select>
          </>
        )}

        {space.type === "多功能厅" && (
          <>
            <label style={label}>场地分区</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
              {allPartitions.map(pt => (
                <Pill key={pt} active={partitions.includes(pt)} onClick={() => toggle(partitions, setPartitions, pt)} color="#6E3FA3">{pt}</Pill>
              ))}
            </div>
            <label style={label}>设备需求</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {allAv.map(a => (
                <Pill key={a} active={av.includes(a)} onClick={() => toggle(av, setAv, a)} color="#6E3FA3">{a}</Pill>
              ))}
            </div>
          </>
        )}

        {error && <div style={{ color: "#B3261E", fontSize: 13, marginTop: 14 }}>{error}</div>}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `1px solid ${LINE}`, background: "#fff", color: SLATE, fontWeight: 700, cursor: "pointer" }}>取消</button>
          <button onClick={submit} style={{ flex: 1.4, padding: "10px 0", borderRadius: 8, border: "none", background: BRAND, color: "#fff", fontWeight: 700, cursor: "pointer" }}>
            {space.type === "会议室" ? "确认预约" : "提交审批"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ space drawer ----------------------------- */
function SpaceDrawer({ space, date, bookings, onClose, onNewBooking }) {
  const meta = TYPE_META[space.type];
  const dayBookings = bookings.filter(b => b.spaceId === space.id && b.date === date && b.status !== "cancelled")
    .sort((a, b) => timeToMin(a.start) - timeToMin(b.start));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,26,38,0.35)", zIndex: 90, display: "flex", justifyContent: "flex-end" }} onClick={onClose}>
      <div style={{ width: 420, background: "#fff", height: "100%", padding: 24, overflowY: "auto" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: SLATE, marginBottom: 10 }}><X size={18} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: meta.soft, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <meta.icon size={18} color={meta.color} />
          </div>
          <div style={{ fontSize: 17, fontWeight: 800, color: INK }}>{space.name}</div>
        </div>
        <div style={{ fontSize: 13, color: SLATE, marginBottom: 4 }}>{space.floor} · 容纳 {space.capacity} 人</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {space.equip.map(e => (
            <span key={e} style={{ fontSize: 12, color: SLATE, background: CANVAS, padding: "3px 9px", borderRadius: 6 }}>{e}</span>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 800, color: INK, marginBottom: 10 }}>{date} 排期</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {dayBookings.length === 0 && <div style={{ fontSize: 13, color: SLATE }}>今日暂无预约，空间空闲。</div>}
          {dayBookings.map(b => (
            <div key={b.id} style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: INK }}>{b.title}</div>
                <Badge status={b.status} />
              </div>
              <div style={{ fontSize: 12.5, color: SLATE }}>{b.start}–{b.end} · {b.organizer}（{b.dept}）· {b.people}人</div>
            </div>
          ))}
        </div>

        <button onClick={() => onNewBooking(space)} style={{
          width: "100%", padding: "11px 0", borderRadius: 9, border: "none",
          background: BRAND, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        }}>
          <Plus size={16} /> 新建预约
        </button>
      </div>
    </div>
  );
}

/* ------------------------------ booking view ----------------------------- */
function BookingApp({ spaces, bookings, setBookings, notify }) {
  const [subtab, setSubtab] = useState("browse");
  const [typeFilter, setTypeFilter] = useState("全部");
  const [date, setDate] = useState(today);
  const [drawerSpace, setDrawerSpace] = useState(null);
  const [formSpace, setFormSpace] = useState(null);

  const filteredSpaces = spaces.filter(s => typeFilter === "全部" || s.type === typeFilter);

  function countToday(spaceId) {
    return bookings.filter(b => b.spaceId === spaceId && b.date === date && b.status !== "cancelled").length;
  }

  function submitBooking(b) {
    setBookings(prev => [...prev, b]);
    setFormSpace(null);
    setDrawerSpace(null);
    const auto = b.status === "confirmed";
    notify(auto
      ? `预约成功，已通过邮件/短信/企业微信通知 ${b.people} 位参会人`
      : `已提交审批，通过后将自动通知参会人`);
    insertBooking(b).catch(() => notify("保存到服务器失败，请检查网络后重试"));
  }

  const myBookings = bookings.filter(b => b.organizer === CURRENT_USER.name).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)).reverse();

  function act(id, updater, msg) {
    let updated = null;
    setBookings(prev => prev.map(b => {
      if (b.id !== id) return b;
      updated = updater(b);
      return updated;
    }));
    if (msg) notify(msg);
    if (updated) patchBooking(id, updated).catch(() => notify("同步到服务器失败，请检查网络"));
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <Pill active={subtab === "browse"} onClick={() => setSubtab("browse")}>空间预约</Pill>
        <Pill active={subtab === "mine"} onClick={() => setSubtab("mine")}>我的预约（{myBookings.length}）</Pill>
      </div>

      {subtab === "browse" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {["全部", "会议室", "宴会厅", "多功能厅"].map(t => (
                <Pill key={t} active={typeFilter === t} onClick={() => setTypeFilter(t)} color={t !== "全部" ? TYPE_META[t].color : undefined}>{t}</Pill>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: SLATE }}>
              <Calendar size={15} />
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ border: `1px solid ${LINE}`, borderRadius: 7, padding: "6px 9px", fontSize: 13 }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
            {filteredSpaces.map(s => {
              const meta = TYPE_META[s.type];
              const n = countToday(s.id);
              return (
                <Card key={s.id} style={{ padding: 16, cursor: "pointer" }}>
                  <div onClick={() => setDrawerSpace(s)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: meta.soft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <meta.icon size={16} color={meta.color} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: meta.color, background: meta.soft, padding: "2px 8px", borderRadius: 6 }}>{s.type}</span>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 15, color: INK, marginBottom: 3 }}>{s.name}</div>
                    <div style={{ fontSize: 12.5, color: SLATE, marginBottom: 10 }}>{s.floor} · 容纳 {s.capacity} 人</div>
                    <div style={{ fontSize: 12.5, color: n > 0 ? "#B5460B" : "#0E8A5F", fontWeight: 700 }}>
                      {n > 0 ? `今日已有 ${n} 个时段被预定` : "今日空闲"}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {subtab === "mine" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {myBookings.length === 0 && <div style={{ color: SLATE, fontSize: 13 }}>暂无预约记录。</div>}
          {myBookings.map(b => {
            const sp = spaces.find(s => s.id === b.spaceId);
            return (
              <Card key={b.id} style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 800, fontSize: 14.5, color: INK }}>{b.title}</span>
                    <Badge status={b.status} />
                    {b.checkedIn && <span style={{ fontSize: 11, color: "#0E8A5F" }}>· 已签到</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: SLATE }}>{sp?.name} · {b.date} {b.start}–{b.end} · {b.people}人</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(b.status === "confirmed" || b.status === "ongoing") && !b.checkedIn && (
                    <button onClick={() => act(b.id, x => ({ ...x, checkedIn: true, status: "ongoing" }), "签到成功")} style={btnStyle("#0E8A5F")}><LogIn size={13} /> 签到</button>
                  )}
                  {(b.status === "confirmed" || b.status === "ongoing") && (
                    <>
                      <button onClick={() => act(b.id, x => ({ ...x, end: addMinutes(x.end, 30) }), "已延长 30 分钟")} style={btnStyle(BRAND)}><TimerReset size={13} /> 延长</button>
                      <button onClick={() => act(b.id, x => ({ ...x, status: "ended" }), "已提前结束，空间已释放")} style={btnStyle("#8A93A3")}><DoorOpen size={13} /> 提前结束</button>
                    </>
                  )}
                  {b.status === "pending" && (
                    <button onClick={() => act(b.id, x => ({ ...x, status: "cancelled" }), "已取消预约")} style={btnStyle("#B3261E")}><X size={13} /> 取消</button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {drawerSpace && (
        <SpaceDrawer space={drawerSpace} date={date} bookings={bookings} onClose={() => setDrawerSpace(null)} onNewBooking={s => setFormSpace(s)} />
      )}
      {formSpace && (
        <BookingForm space={formSpace} defaultDate={date} onCancel={() => setFormSpace(null)} onSubmit={submitBooking} />
      )}
    </div>
  );
}

function btnStyle(color) {
  return {
    display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 7,
    border: `1px solid ${color}33`, background: "#fff", color, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
  };
}

/* ------------------------------ admin view ------------------------------- */
function AdminApp({ spaces, setSpaces, bookings, setBookings, notify }) {
  const [subtab, setSubtab] = useState("dashboard");

  const pending = bookings.filter(b => b.status === "pending");
  const usageByType = useMemo(() => {
    const map = {};
    TYPE_META && Object.keys(TYPE_META).forEach(t => (map[t] = 0));
    bookings.filter(b => b.status !== "cancelled").forEach(b => {
      const sp = spaces.find(s => s.id === b.spaceId);
      if (sp) map[sp.type] = (map[sp.type] || 0) + 1;
    });
    return Object.entries(map).map(([type, count]) => ({ type, count }));
  }, [bookings, spaces]);

  const usageByDept = useMemo(() => {
    const map = {};
    bookings.filter(b => b.status !== "cancelled").forEach(b => { map[b.dept] = (map[b.dept] || 0) + 1; });
    return DEPTS.map(d => ({ dept: d, count: map[d] || 0 }));
  }, [bookings]);

  const total = bookings.filter(b => b.status !== "cancelled").length;
  const checkedInRate = total ? Math.round((bookings.filter(b => b.checkedIn).length / total) * 100) : 0;
  const usageRate = Math.min(100, Math.round((total / (spaces.length * 6)) * 100));

  function approve(id, ok) {
    const newStatus = ok ? "confirmed" : "cancelled";
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    notify(ok ? "审批通过，已自动通知参会人与相关服务人员" : "已驳回该申请");
    patchBooking(id, { status: newStatus }).catch(() => notify("同步到服务器失败，请检查网络"));
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <Pill active={subtab === "dashboard"} onClick={() => setSubtab("dashboard")}>数据看板</Pill>
        <Pill active={subtab === "approval"} onClick={() => setSubtab("approval")}>审批队列（{pending.length}）</Pill>
        <Pill active={subtab === "spaces"} onClick={() => setSubtab("spaces")}>空间管理</Pill>
        <Pill active={subtab === "records"} onClick={() => setSubtab("records")}>预约记录</Pill>
      </div>

      {subtab === "dashboard" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 14, marginBottom: 20 }}>
            <StatCard label="今日预约总数" value={total} sub="含全部空间类型" />
            <StatCard label="空间使用率" value={usageRate + "%"} sub="基于近似饱和度估算" />
            <StatCard label="待审批" value={pending.length} sub="宴会厅 / 多功能厅" />
            <StatCard label="签到率" value={checkedInRate + "%"} sub="已签到 / 应到" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 14 }}>
            <Card style={{ padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: INK, marginBottom: 12 }}>各空间类型预约次数</div>
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usageByType}>
                    <CartesianGrid stroke={LINE} vertical={false} />
                    <XAxis dataKey="type" tick={{ fontSize: 12, fill: SLATE }} axisLine={{ stroke: LINE }} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: SLATE }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill={BRAND} radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
            <Card style={{ padding: 18 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: INK, marginBottom: 12 }}>部门用量排行</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {usageByDept.sort((a, b) => b.count - a.count).map(d => (
                  <div key={d.dept}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: SLATE, marginBottom: 3 }}>
                      <span>{d.dept}</span><span>{d.count}</span>
                    </div>
                    <div style={{ height: 6, background: CANVAS, borderRadius: 4 }}>
                      <div style={{ height: 6, width: `${Math.min(100, d.count * 20)}%`, background: BRAND, borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {subtab === "approval" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pending.length === 0 && <div style={{ color: SLATE, fontSize: 13 }}>暂无待审批申请。</div>}
          {pending.map(b => {
            const sp = spaces.find(s => s.id === b.spaceId);
            return (
              <Card key={b.id} style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 14.5, color: INK, marginBottom: 4 }}>{b.title}</div>
                    <div style={{ fontSize: 12.5, color: SLATE, marginBottom: 6 }}>{sp?.name} · {b.date} {b.start}–{b.end} · 申请人 {b.organizer}（{b.dept}）· {b.people}人</div>
                    {b.catering && <div style={{ fontSize: 12.5, color: SLATE }}>用餐 {b.catering.count} 人 · {b.catering.standard} · {b.catering.table}</div>}
                    {b.partitions && <div style={{ fontSize: 12.5, color: SLATE }}>分区：{b.partitions.join("、") || "未选择"} · 设备：{b.av.join("、") || "无"}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <button onClick={() => approve(b.id, true)} style={btnStyle("#0E8A5F")}><Check size={13} /> 通过</button>
                    <button onClick={() => approve(b.id, false)} style={btnStyle("#B3261E")}><X size={13} /> 驳回</button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {subtab === "spaces" && <SpaceManager spaces={spaces} setSpaces={setSpaces} notify={notify} />}

      {subtab === "records" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", color: SLATE, borderBottom: `1px solid ${LINE}` }}>
                {["主题", "空间", "日期/时间", "申请人", "部门", "状态"].map(h => <th key={h} style={{ padding: "8px 10px", fontWeight: 700 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {bookings.slice().sort((a, b) => (b.date + b.start).localeCompare(a.date + a.start)).map(b => {
                const sp = spaces.find(s => s.id === b.spaceId);
                return (
                  <tr key={b.id} style={{ borderBottom: `1px solid ${LINE}` }}>
                    <td style={{ padding: "9px 10px", fontWeight: 600, color: INK }}>{b.title}</td>
                    <td style={{ padding: "9px 10px", color: SLATE }}>{sp?.name}</td>
                    <td style={{ padding: "9px 10px", color: SLATE }}>{b.date} {b.start}–{b.end}</td>
                    <td style={{ padding: "9px 10px", color: SLATE }}>{b.organizer}</td>
                    <td style={{ padding: "9px 10px", color: SLATE }}>{b.dept}</td>
                    <td style={{ padding: "9px 10px" }}><Badge status={b.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <Card style={{ padding: 16 }}>
      <div style={{ fontSize: 12.5, color: SLATE, marginBottom: 8, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: INK, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11.5, color: "#9AA4B2" }}>{sub}</div>
    </Card>
  );
}

function SpaceManager({ spaces, setSpaces, notify }) {
  const [editing, setEditing] = useState(null); // space or "new"
  const [form, setForm] = useState({ name: "", type: "会议室", floor: "", capacity: 10, equip: "" });

  function openNew() {
    setForm({ name: "", type: "会议室", floor: "", capacity: 10, equip: "" });
    setEditing("new");
  }
  function openEdit(s) {
    setForm({ name: s.name, type: s.type, floor: s.floor, capacity: s.capacity, equip: s.equip.join("、") });
    setEditing(s.id);
  }
  function save() {
    const payload = { name: form.name, type: form.type, floor: form.floor, capacity: Number(form.capacity), equip: form.equip.split(/[、,，]/).map(x => x.trim()).filter(Boolean) };
    if (editing === "new") {
      const newSpace = { id: uid(), ...payload };
      setSpaces(prev => [...prev, newSpace]);
      notify("已新增空间");
      insertSpace(newSpace).catch(() => notify("同步到服务器失败，请检查网络"));
    } else {
      setSpaces(prev => prev.map(s => s.id === editing ? { ...s, ...payload } : s));
      notify("已更新空间信息");
      patchSpace(editing, payload).catch(() => notify("同步到服务器失败，请检查网络"));
    }
    setEditing(null);
  }
  function remove(id) {
    setSpaces(prev => prev.filter(s => s.id !== id));
    notify("已删除该空间");
    deleteSpace(id).catch(() => notify("从服务器删除失败，请检查网络"));
  }

  const input = { padding: "8px 10px", borderRadius: 7, border: `1px solid ${LINE}`, fontSize: 13, width: "100%", boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button onClick={openNew} style={{ ...btnStyle(BRAND), padding: "8px 14px" }}><Plus size={14} /> 新增空间</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {spaces.map(s => {
          const meta = TYPE_META[s.type];
          return (
            <Card key={s.id} style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 7, background: meta.soft, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <meta.icon size={15} color={meta.color} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: INK }}>{s.name}</div>
                  <div style={{ fontSize: 12, color: SLATE }}>{s.type} · {s.floor} · 容纳{s.capacity}人 · {s.equip.join("、") || "无设备登记"}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => openEdit(s)} style={btnStyle(BRAND)}><Pencil size={13} /> 编辑</button>
                <button onClick={() => remove(s.id)} style={btnStyle("#B3261E")}><Trash2 size={13} /> 删除</button>
              </div>
            </Card>
          );
        })}
      </div>

      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(20,26,38,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#fff", borderRadius: 14, width: 380, padding: 22 }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: INK, marginBottom: 14 }}>{editing === "new" ? "新增空间" : "编辑空间"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input style={input} placeholder="空间名称" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              <select style={input} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {Object.keys(TYPE_META).map(t => <option key={t}>{t}</option>)}
              </select>
              <input style={input} placeholder="楼层，例如 3F" value={form.floor} onChange={e => setForm({ ...form, floor: e.target.value })} />
              <input type="number" style={input} placeholder="容纳人数" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} />
              <input style={input} placeholder="设备（顿号分隔）" value={form.equip} onChange={e => setForm({ ...form, equip: e.target.value })} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button onClick={() => setEditing(null)} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: `1px solid ${LINE}`, background: "#fff", color: SLATE, fontWeight: 700, cursor: "pointer" }}>取消</button>
              <button onClick={save} style={{ flex: 1, padding: "9px 0", borderRadius: 8, border: "none", background: BRAND, color: "#fff", fontWeight: 700, cursor: "pointer" }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- root ---------------------------------- */
export default function PCApp({ publicMode = false }) {
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [role, setRole] = useState("booking"); // booking | admin
  const [toast, setToast] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");

  function notify(msg) {
    setToast(msg);
    setTimeout(() => setToast(""), 3200);
  }

  async function loadAll() {
    try {
      const [s, b] = await Promise.all([fetchSpaces(), fetchBookings()]);
      setSpaces(s);
      setBookings(b);
      setLoadError("");
    } catch (e) {
      setLoadError("加载数据失败，请检查网络连接或稍后重试");
    } finally {
      setLoaded(true);
    }
  }

  useEffect(() => { loadAll(); }, []);

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: CANVAS, display: "flex", alignItems: "center", justifyContent: "center", color: SLATE, fontFamily: "-apple-system, sans-serif", gap: 8 }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } } .spin-icon { animation: spin 1s linear infinite; }`}</style>
        <Loader2 size={16} className="spin-icon" /> 正在加载预约数据…
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "-apple-system, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif", background: CANVAS, minHeight: "100vh", color: INK }}>
      <div style={{ background: "#fff", borderBottom: `1px solid ${LINE}`, padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: BRAND, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LayoutGrid size={17} color="#fff" />
          </div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>智慧空间预约系统</div>
          {loadError
            ? <span style={{ fontSize: 11.5, color: "#B3261E", marginLeft: 6 }}>{loadError}</span>
            : <span style={{ fontSize: 11.5, color: "#0E8A5F", display: "flex", alignItems: "center", gap: 4, marginLeft: 6 }}><Check size={11} /> 已连接数据库</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {!publicMode && (
            <div style={{ display: "flex", background: CANVAS, borderRadius: 999, padding: 3 }}>
              <button onClick={() => setRole("booking")} style={{
                padding: "7px 16px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                background: role === "booking" ? "#fff" : "transparent", color: role === "booking" ? BRAND : SLATE,
                boxShadow: role === "booking" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                display: "flex", alignItems: "center", gap: 6,
              }}><ClipboardList size={14} /> 预约端</button>
              <button onClick={() => setRole("admin")} style={{
                padding: "7px 16px", borderRadius: 999, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                background: role === "admin" ? "#fff" : "transparent", color: role === "admin" ? BRAND : SLATE,
                boxShadow: role === "admin" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                display: "flex", alignItems: "center", gap: 6,
              }}><Settings size={14} /> 管理后台</button>
            </div>
          )}
          <div style={{ fontSize: 13, color: SLATE }}>{CURRENT_USER.name} · {CURRENT_USER.dept}</div>
          <button onClick={loadAll} style={{ display: "flex", alignItems: "center", gap: 5, border: `1px solid ${LINE}`, background: "#fff", color: SLATE, padding: "6px 11px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            刷新数据
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "24px 20px 60px" }}>
        {(publicMode ? "booking" : role) === "booking"
          ? <BookingApp spaces={spaces} bookings={bookings} setBookings={setBookings} notify={notify} />
          : <AdminApp spaces={spaces} setSpaces={setSpaces} bookings={bookings} setBookings={setBookings} notify={notify} />}
      </div>

      <Toast text={toast} />
    </div>
  );
}
