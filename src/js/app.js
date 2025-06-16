import { GridStack } from 'gridstack';
import * as Store from './store.js';
import { create as createCard } from './ui/card.js';
import { create as createFolder } from './ui/folder.js';

const grid = GridStack.init(
  { column: 12, float: false, resizable: { handles: 'e, se, s, w' } },
  '#grid'
);
grid.on('change', saveLayout);

const fabAdd = document.getElementById('fab-add');
const fabMenu = document.getElementById('fab-menu');
document.getElementById('fab-add-card').addEventListener('click', () => { fabMenu.classList.remove('show'); addCard(); });
document.getElementById('fab-add-folder').addEventListener('click', () => { fabMenu.classList.remove('show'); addFolder(); });
fabAdd.addEventListener('click', () => {
  fabMenu.classList.toggle('show');
});
document.addEventListener('click', e => {
  if (!fabAdd.contains(e.target) && !fabMenu.contains(e.target)) {
    fabMenu.classList.remove('show');
  }
});

function addCard(data={x:0,y:0,w:3,h:2}){
  const el = createCard({});
  grid.addWidget(el,data);
  saveLayout();
}

function addFolder(data={x:0,y:0,w:3,h:3}){
  const el = createFolder({});
  grid.addWidget(el,data);
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
      const item = Store.data.items[opts.id] || {};
      let el;
      if (item.type === 'folder') el = createFolder(item);
      else el = createCard(item);
      grid.addWidget(el, opts);
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
