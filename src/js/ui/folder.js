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
}
