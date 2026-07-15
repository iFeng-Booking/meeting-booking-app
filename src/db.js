import { supabase } from "./supabaseClient";

/* ---- row <-> app-object mapping ---- */
function rowToBooking(r) {
  return {
    id: r.id,
    spaceId: r.space_id,
    title: r.title,
    date: r.date,
    start: r.start_time,
    end: r.end_time,
    organizer: r.organizer,
    dept: r.dept,
    people: r.people,
    status: r.status,
    checkedIn: !!r.checked_in,
    catering: r.catering || undefined,
    partitions: r.partitions || undefined,
    av: r.av || undefined,
  };
}
function bookingToRow(b) {
  return {
    id: b.id,
    space_id: b.spaceId,
    title: b.title,
    date: b.date,
    start_time: b.start,
    end_time: b.end,
    organizer: b.organizer,
    dept: b.dept,
    people: b.people,
    status: b.status,
    checked_in: !!b.checkedIn,
    catering: b.catering || null,
    partitions: b.partitions || null,
    av: b.av || null,
  };
}
function rowToSpace(r) {
  return { id: r.id, name: r.name, type: r.type, floor: r.floor, capacity: r.capacity, equip: r.equip || [] };
}
function spaceToRow(s) {
  return { id: s.id, name: s.name, type: s.type, floor: s.floor, capacity: s.capacity, equip: s.equip || [] };
}
function patchToBookingRow(patch) {
  const row = {};
  if ("status" in patch) row.status = patch.status;
  if ("end" in patch) row.end_time = patch.end;
  if ("start" in patch) row.start_time = patch.start;
  if ("checkedIn" in patch) row.checked_in = patch.checkedIn;
  return row;
}
function patchToSpaceRow(patch) {
  const row = {};
  if ("name" in patch) row.name = patch.name;
  if ("type" in patch) row.type = patch.type;
  if ("floor" in patch) row.floor = patch.floor;
  if ("capacity" in patch) row.capacity = patch.capacity;
  if ("equip" in patch) row.equip = patch.equip;
  return row;
}

/* ---- spaces ---- */
export async function fetchSpaces() {
  const { data, error } = await supabase.from("spaces").select("*").order("name");
  if (error) throw error;
  return data.map(rowToSpace);
}
export async function insertSpace(space) {
  const { error } = await supabase.from("spaces").insert([spaceToRow(space)]);
  if (error) throw error;
}
export async function patchSpace(id, patch) {
  const { error } = await supabase.from("spaces").update(patchToSpaceRow(patch)).eq("id", id);
  if (error) throw error;
}
export async function deleteSpace(id) {
  const { error } = await supabase.from("spaces").delete().eq("id", id);
  if (error) throw error;
}

/* ---- bookings ---- */
export async function fetchBookings() {
  const { data, error } = await supabase.from("bookings").select("*").order("date").order("start_time");
  if (error) throw error;
  return data.map(rowToBooking);
}
export async function insertBooking(booking) {
  const { error } = await supabase.from("bookings").insert([bookingToRow(booking)]);
  if (error) throw error;
}
export async function patchBooking(id, patch) {
  const { error } = await supabase.from("bookings").update(patchToBookingRow(patch)).eq("id", id);
  if (error) throw error;
}
