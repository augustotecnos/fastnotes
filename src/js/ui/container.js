import * as Store from '../store.js';

export function create(data = {}) {
  const item = { type: 'container', title: data.title || 'Container', id: data.id };
  const id = Store.upsert(item);
  const wrapper = document.createElement('div');
  wrapper.setAttribute('gs-id', id);
  wrapper.innerHTML = `<div class="grid-stack-item-content container"><h6>${item.title}</h6></div>`;
  return wrapper;
}
