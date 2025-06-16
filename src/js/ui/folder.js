import * as Store from '../store.js';

export function create(data = {}) {
  const item = { type: 'folder', title: data.title || 'Folder', id: data.id };
  const id = Store.upsert(item);
  const wrapper = document.createElement('div');
  wrapper.setAttribute('gs-id', id);
  wrapper.innerHTML = `<div class="grid-stack-item-content folder"><h6>${item.title}</h6></div>`;
  return wrapper;
}
