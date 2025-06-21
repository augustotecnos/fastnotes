import { nanoid } from "nanoid";
import * as Auth from "./drive/auth.js";
import * as DriveSync from "./drive/sync.js";

const KEY = "fastnotes-json";
export let data = {
  version: 1,
  updated: Date.now(),
  items: {},
  layout: [],
  trash: {},
};
let syncTimer;

export async function load() {
  const raw = localStorage.getItem(KEY);
  if (raw) data = JSON.parse(raw);
  if (!data.trash) data.trash = {};
  return data;
}

export function save() {
  data.updated = Date.now();
  localStorage.setItem(KEY, JSON.stringify(data));
  scheduleSync();
}

function scheduleSync() {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(sync, 2000);
}

export function upsert(item) {
  if (!item.id) item.id = nanoid();
  if (!item.parent) item.parent = "root";
  data.items[item.id] = item;
  save();
  return item.id;
}

export function patch(id, changes) {
  if (!data.items[id]) return;
  Object.assign(data.items[id], changes);
  save();
}

export function trash(id) {
  const item = data.items[id];
  if (!item) return;
  const parentId = item.parent || "root";
  if (parentId !== "root") {
    const p = data.items[parentId];
    if (p && Array.isArray(p.children)) {
      p.children = p.children.filter((cid) => cid !== id);
    }
  }
  item.trashedAt = Date.now();
  data.trash[id] = item;
  delete data.items[id];
  save();
}

export function remove(id) {
  if (data.items[id]) {
    delete data.items[id];
  }
  if (data.trash[id]) {
    delete data.trash[id];
  }
  save();
}

export function restore(id) {
  const item = data.trash[id];
  if (!item) return;
  delete item.trashedAt;
  data.items[id] = item;
  delete data.trash[id];
  save();
  return item;
}

export function setParent(id, parentId) {
  const item = data.items[id];
  if (!item) return;
  const oldParent = item.parent || "root";
  if (oldParent === parentId) return;

  // remove from old parent children
  if (oldParent !== "root") {
    const p = data.items[oldParent];
    if (p && Array.isArray(p.children)) {
      p.children = p.children.filter((cid) => cid !== id);
    }
  }

  item.parent = parentId || "root";

  if (parentId && parentId !== "root") {
    const newParent = data.items[parentId] || {};
    if (!Array.isArray(newParent.children)) newParent.children = [];
    if (!newParent.children.includes(id)) newParent.children.push(id);
    data.items[parentId] = newParent;
  }

  save();
}

export function exportJSON() {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fastnotes-${Date.now()}.fastnotes.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJSON(file) {
  const text = await file.text();
  const obj = JSON.parse(text);
  if (!obj || typeof obj !== "object") return;
  data = obj;
  save();
}

export async function sync() {
  if (Auth.isSignedIn()) {
    try {
      await DriveSync.upload(data);
    } catch (err) {
      console.error("Drive sync failed", err);
    }
  }
}
