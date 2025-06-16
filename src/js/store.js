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
