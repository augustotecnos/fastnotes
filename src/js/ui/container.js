import { GridStack } from 'gridstack';
import * as Store from '../store.js';
import { create as createCard } from './card.js';

export function create(data = {}) {
  const item = {
    type: 'container',
    title: data.title || 'Container',
    children: data.children || [],
    id: data.id,
    parent: data.parent || 'root',
    layout: data.layout || []
  };
  const id = Store.upsert(item);
  const wrapper = document.createElement('div');
  wrapper.setAttribute('gs-id', id);
  wrapper.dataset.parent = item.parent;
  wrapper.innerHTML = `
    <div class="grid-stack-item-content container">
      <h6 contenteditable="true"></h6>
      <div class="grid-stack subgrid" id="sub-${id}"></div>
    </div>`;
  const content = wrapper.firstElementChild;
  const titleEl = content.querySelector('h6');
  const subEl = content.querySelector('.subgrid');
  titleEl.textContent = item.title;
  titleEl.addEventListener('input', () => {
    Store.patch(id, { title: titleEl.textContent });
  });

  const subgrid = GridStack.init({ column: 12, float: false }, subEl);
  subgrid.on('change', () => {
    Store.data.items[id].layout = subgrid.save();
    Store.save();
  });

  // restore children
  if (item.layout.length) {
    subgrid.removeAll();
    item.layout.forEach(opts => {
      const child = Store.data.items[opts.id];
      if (!child) return;
      let el;
      if (child.type === 'card') el = createCard(child);
      // support nested containers/folders later
      subgrid.addWidget(el, opts);
    });
  } else if (item.children.length) {
    item.children.forEach(cid => {
      const child = Store.data.items[cid];
      if (!child) return;
      let el = createCard(child);
      subgrid.addWidget(el, {x:0,y:0,w:3,h:2});
    });
  }

  return { el: wrapper, grid: subgrid };
}
