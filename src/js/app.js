import { GridStack } from 'gridstack';
import * as Store from './store.js';
import { create as createCard } from './ui/card.js';
import { create as createContainer } from './ui/container.js';
import { create as createFolder } from './ui/folder.js';

const grid = GridStack.init(
  { column: 12, float: false, resizable: { handles: 'e, se, s, w' } },
  '#grid'
);
grid.on('change', saveLayout);

const fab = document.getElementById('fab');
const fabMain = document.getElementById('fab-main');
const fabCard = document.getElementById('fab-card');
const fabContainerBtn = document.getElementById('fab-container');
const fabFolderBtn = document.getElementById('fab-folder');

fabMain.addEventListener('click', toggleMenu);
fabCard.addEventListener('click', () => { addCard(); toggleMenu(false); });
fabContainerBtn.addEventListener('click', () => { addContainer(); toggleMenu(false); });
fabFolderBtn.addEventListener('click', () => { addFolder(); toggleMenu(false); });
document.addEventListener('keydown', e => { if(e.key === 'Escape') toggleMenu(false); });

toggleMenu(false);

function toggleMenu(force){
  const open = typeof force === 'boolean' ? force : !fab.classList.contains('open');
  fab.classList.toggle('open', open);
  [fabCard, fabContainerBtn, fabFolderBtn].forEach(btn => btn.disabled = !open);
  if(open) fabCard.focus();
}

function addCard(data={x:0,y:0,w:3,h:2}){
  const el = createCard({});
  grid.addWidget(el,data);
  saveLayout();
}

function addContainer(data={x:0,y:0,w:3,h:2}){
  const el = createContainer({});
  grid.addWidget(el,data);
  saveLayout();
}

function addFolder(data={x:0,y:0,w:3,h:2}){
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
      if (item.type === 'container') el = createContainer(item);
      else if (item.type === 'folder') el = createFolder(item);
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
