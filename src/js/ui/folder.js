import { GridStack } from 'gridstack';
import * as Store from '../store.js';
import { create as createCard } from './card.js';

export function create(data = {}) {
  const item = {
    type: 'folder',
    title: data.title || 'Folder',
    children: data.children || [],

    layout: data.layout || [],
    id: data.id
  };
  const id = Store.upsert(item);
  const wrapper = document.createElement('div');
  wrapper.setAttribute('gs-id', id);
  wrapper.innerHTML = '<div class="grid-stack-item-content folder-icon">\ud83d\udcc1</div>';
  const icon = wrapper.firstElementChild;

  icon.addEventListener('click', openFolder);

  function openFolder() {
    const overlay = document.createElement('div');
    overlay.className = 'folder-overlay';
    overlay.innerHTML = `
      <button class="folder-back" aria-label="Back">\u2190</button>
      <div class="grid-stack folder-grid"></div>
    `;
    document.body.appendChild(overlay);
    const gridEl = overlay.querySelector('.folder-grid');
    const childGrid = GridStack.init({ column: 12, float: false, resizable:{ handles:'e, se, s, w' } }, gridEl);

    if (item.layout && item.layout.length) {
      item.layout.forEach(opts => {
        const childItem = Store.data.items[opts.id];
        if (!childItem) return;
        let el;
        if (childItem.type === 'card') {
          el = createCard(childItem);
        }
        if (el) childGrid.addWidget(el, opts);
      });
    }

    childGrid.on('change', () => {
      item.layout = childGrid.save();
      Store.upsert(item);
    });

    function close() {
      document.removeEventListener('keydown', onKey);
      childGrid.destroy();
      overlay.remove();
    }

    function onKey(e) {
      if (e.key === 'Escape') close();
    }

    overlay.querySelector('.folder-back').addEventListener('click', close);
    document.addEventListener('keydown', onKey);
  }

  return wrapper;
    id: data.id,
    parent: data.parent || 'root',
    layout: data.layout || []
  };
  const id = Store.upsert(item);

  const wrapper = document.createElement('div');
  wrapper.setAttribute('gs-id', id);
  wrapper.dataset.parent = item.parent;
  wrapper.innerHTML = `<div class="grid-stack-item-content folder">📁 ${item.title}</div>`;

  const overlay = document.createElement('div');
  overlay.className = 'folder-overlay hidden';
  overlay.innerHTML = `<div class="grid-stack folder-grid" id="fold-${id}"></div>`;
  document.body.appendChild(overlay);

  const gridEl = overlay.querySelector('.folder-grid');
  const grid = GridStack.init({ column: 12, float: false }, gridEl);
  grid.on('change', () => {
    Store.data.items[id].layout = grid.save();
    Store.save();
  });

  wrapper.addEventListener('click', () => overlay.classList.remove('hidden'));
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });

  // restore children
  if (item.layout.length) {
    grid.removeAll();
    item.layout.forEach(opts => {
      const child = Store.data.items[opts.id];
      if (!child) return;
      let el;
      if (child.type === 'card') el = createCard(child);
      grid.addWidget(el, opts);
    });
  } else if (item.children.length) {
    item.children.forEach(cid => {
      const child = Store.data.items[cid];
      if (!child) return;
      let el = createCard(child);
      grid.addWidget(el, {x:0,y:0,w:3,h:2});
    });
  }

  return { el: wrapper, grid };

}
