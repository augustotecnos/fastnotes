import { nanoid } from 'nanoid';

const KEY = 'fastnotes-json';
export let data = { version: 1, updated: Date.now(), items: {}, layout: [] };

export async function load() {
  const raw = localStorage.getItem(KEY);
  if (raw) data = JSON.parse(raw);
  return data;
}

export function save() {
  data.updated = Date.now();
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function upsert(item) {
  if (!item.id) item.id = nanoid();
  data.items[item.id] = item;
  save();
  return item.id;
}

export function patch(id, changes) {
  if (!data.items[id]) return;
  Object.assign(data.items[id], changes);
  save();
}

export function remove(id) {
  delete data.items[id];
  save();
}

export function exportJSON() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fastnotes-${Date.now()}.fastnotes.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJSON(file) {
  const text = await file.text();
  const obj = JSON.parse(text);
  if (!obj || typeof obj !== 'object') return;
  data = obj;
  save();
}
