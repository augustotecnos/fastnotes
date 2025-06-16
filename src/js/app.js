import { GridStack } from 'gridstack';
import * as Store from './store.js';
import { create as createCard } from './ui/card.js';
import { create as createContainer } from './ui/container.js';
import { create as createFolder } from './ui/folder.js';

let dragItem = null;

function attachGridEvents(g) {
  g.on('dragstart', (_e, el) => {
    dragItem = {
      id: el.getAttribute('gs-id'),
    };
  });

  g.on('dropped', (_e, prev, node) => {
    const el = document.querySelector(`[gs-id="${node.id}"]`);
    if (!el) return;
    const parentId = g.el.closest('[gs-id]')?.getAttribute('gs-id') || 'root';
    el.dataset.parent = parentId;
    Store.setParent(node.id, parentId);
    Store.save();
    if (g === grid) saveLayout();
  });
}

const grid = GridStack.init(
  { column: 12, float: false, resizable: { handles: 'e, se, s, w' } },
  '#grid'
);
grid.on('change', saveLayout);

attachGridEvents(grid);

document.getElementById('fab-add').addEventListener('click', () => addCard());

function addCard(data={x:0,y:0,w:3,h:2}, g=grid, parent='root'){
  const el = createCard({parent});
  g.addWidget(el,data);
  if (g === grid) saveLayout();
}

function addContainer(data={x:0,y:0,w:6,h:4}) {
  const { el, grid: sub } = createContainer({});
  grid.addWidget(el, data);
  attachGridEvents(sub);
  saveLayout();
}

function addFolder(data={x:0,y:0,w:3,h:3}) {
  const { el, grid: sub } = createFolder({});
  grid.addWidget(el, data);
  attachGridEvents(sub);
  saveLayout();
}

function saveLayout() {
  Store.data.layout = grid.save();
  Store.save();
}

async function restore() {
  await Store.load();
  if (Store.data.layout && Store.data.layout.length) {
    grid.removeAll();
    Store.data.layout.forEach(opts => {
      const data = Store.data.items[opts.id] || {};
      let added;
      if (data.type === 'container') {
        added = createContainer(data);
        grid.addWidget(added.el, opts);
        attachGridEvents(added.grid);
      } else if (data.type === 'folder') {
        added = createFolder(data);
        grid.addWidget(added.el, opts);
        attachGridEvents(added.grid);
      } else {
        const el = createCard(data);
        grid.addWidget(el, opts);
      }
    });
  } else {
    // primeiro uso: 3 cards demo
    addCard({ x: 0, y: 0 });
    addCard({ x: 3, y: 0 });
    addCard({ x: 6, y: 0 });
  }
}
restore();

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/src/js/service-worker.js');
  });
}
