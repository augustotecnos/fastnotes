import { GridStack } from 'gridstack';

import Collapse from 'collapsejs';
import * as Store from '../store.js';

import * as Store from '../store.js';
import { create as createCard } from './card.js';


export function create(data = {}) {
  const item = {
    type: 'container',
    title: data.title || 'Container',

    collapsed: data.collapsed || false,
    id: data.id
  };
  const id = Store.upsert(item);

  const wrapper = document.createElement('div');
  wrapper.setAttribute('gs-id', id);
  wrapper.setAttribute('gs-min-w', 3);
  wrapper.innerHTML = `
    <div class="grid-stack-item-content container">
      <div class="collapsejs">
        <div class="collapse__header">
          <button class="toggle" aria-label="Toggle">▾</button>
          <h6 contenteditable="true" spellcheck="false"></h6>
        </div>
        <div class="collapse__body">
          <div class="grid-stack"></div>
        </div>
      </div>
    </div>`;

  const content = wrapper.querySelector('.grid-stack-item-content');
  const header = content.querySelector('.collapse__header');
  const body = content.querySelector('.collapse__body');
  const titleEl = content.querySelector('h6');
  const toggleBtn = content.querySelector('button.toggle');
  titleEl.textContent = item.title;

  const collapse = new Collapse({
    container: wrapper.querySelector('.collapsejs'),
    closed: item.collapsed,
    multiple: true
  });
  const collapseItem = collapse.items[0];

  const innerGrid = GridStack.init({ staticGrid: true, subGrid: true }, body.querySelector('.grid-stack'));


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


  toggleBtn.addEventListener('click', () => {
    collapseItem.toggle();
    item.collapsed = !collapseItem.isActive;
    Store.patch(id, { collapsed: item.collapsed });
    setTimeout(adjustHeight, 310); // wait for animation
  });

  // initial size when added
  setTimeout(adjustHeight);

  function adjustHeight() {
    const parentGrid = wrapper.closest('.grid-stack')?.gridstack;
    if (!parentGrid) return;
    const cellH = parentGrid.getCellHeight();
    const newH = Math.max(1, Math.ceil(content.offsetHeight / cellH));
    parentGrid.update(wrapper, { h: newH });
    parentGrid.save();
  }

  return wrapper;

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
