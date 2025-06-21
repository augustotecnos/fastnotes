import { GridStack } from 'gridstack';
import * as Store from '../store.js';
import { create as createCard } from './card.js';
import { t } from '../i18n.js';

export function create(data = {}) {
  const item = {
    type: 'folder',
    title: data.title || 'Folder',
    desc: data.desc || '',
    children: data.children || [],
    layout: data.layout || [],
    id: data.id
  };
  const id = Store.upsert(item);
  const wrapper = document.createElement('div');
  wrapper.setAttribute('gs-id', id);
  wrapper.innerHTML = `
    <div class="grid-stack-item-content folder-card" tabindex="0" role="listitem" aria-label="Folder">
      <div class="folder-icon">\ud83d\udcc1</div>
      <h6 class="folder-name"></h6>
    </div>
  `;
  const content = wrapper.firstElementChild;
  const nameEl = content.querySelector('.folder-name');
  nameEl.textContent = item.title;

  content.addEventListener('click', openFolder);

  function openFolder() {
    if (document.querySelector('.folder-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'folder-overlay';
    overlay.innerHTML = `
      <div class="folder-header">
        <button class="folder-back" aria-label="Back">\u2190</button>
        <h6 class="folder-title" contenteditable="true"></h6>
        <button class="folder-add" aria-label="${t('addCard')}">+</button>
        <textarea class="folder-desc" rows="2"></textarea>
      </div>
      <div class="grid-stack folder-grid"></div>
    `;
    document.body.appendChild(overlay);
    const titleEl = overlay.querySelector('.folder-title');
    const descEl = overlay.querySelector('.folder-desc');
    const addBtn = overlay.querySelector('.folder-add');
    const gridEl = overlay.querySelector('.folder-grid');
    titleEl.textContent = item.title;
    descEl.value = item.desc;
    titleEl.addEventListener('input', () => {
      item.title = titleEl.textContent;
      nameEl.textContent = item.title;
      Store.patch(id, { title: item.title });
    });
    descEl.addEventListener('input', () => {
      item.desc = descEl.value;
      Store.patch(id, { desc: item.desc });
    });
    const childGrid = GridStack.init({ margin: 5, column: 12, float: false, resizable:{ handles:'e, se, s, w' }, acceptWidgets: true, dragOut: true }, gridEl);
    if (!childGrid) return;

    function save() {
      item.layout = childGrid.save();
      item.children = item.layout.map(c => c.id);
      Store.patch(id, { layout: item.layout, children: item.children, title: item.title, desc: item.desc });
    }

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

    childGrid.on('change', save);

    addBtn.addEventListener('click', () => {
      const el = createCard({ parent: id });
      childGrid.addWidget(el, { w: 3, h: 2, autoPosition: true });
      save();
    });

    function close() {
      document.removeEventListener('keydown', onKey);
      save();
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
