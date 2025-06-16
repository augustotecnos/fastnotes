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
  if (!item.parent) item.parent = 'root';
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

export function setParent(id, parentId) {
  const item = data.items[id];
  if (!item) return;
  const oldParent = item.parent || 'root';
  if (oldParent === parentId) return;

  // remove from old parent children
  if (oldParent !== 'root') {
    const p = data.items[oldParent];
    if (p && Array.isArray(p.children)) {
      p.children = p.children.filter(cid => cid !== id);
    }
  }

  item.parent = parentId || 'root';

  if (parentId && parentId !== 'root') {
    const newParent = data.items[parentId] || {};
    if (!Array.isArray(newParent.children)) newParent.children = [];
    if (!newParent.children.includes(id)) newParent.children.push(id);
    data.items[parentId] = newParent;
  }

  save();
}
