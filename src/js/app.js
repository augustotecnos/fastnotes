import { GridStack } from 'gridstack';
import * as Store from './store.js';
import { create as createCard } from './ui/card.js';
import { create as createContainer } from './ui/container.js';

const grid = GridStack.init(
  { column: 12, float: false, resizable: { handles: 'e, se, s, w' } },
  '#grid'
);
grid.on('change', saveLayout);

const fabMenu = document.getElementById('fab-menu');
document.getElementById('fab-add').addEventListener('click', () => {
  fabMenu.hidden = !fabMenu.hidden;
  fabMenu.classList.toggle('show');
});
document.getElementById('fab-card').addEventListener('click', () => {
  addCard();
  closeMenu();
});
document.getElementById('fab-container').addEventListener('click', () => {
  addContainer();
  closeMenu();
});

function closeMenu() {
  fabMenu.hidden = true;
  fabMenu.classList.remove('show');
}

function addCard(data={x:0,y:0,w:3,h:2}){
  const el = createCard({});
  grid.addWidget(el,data);
  saveLayout();
}

function addContainer(data={x:0,y:0,w:3,h:2}){
  const el = createContainer({});
  grid.addWidget(el, data);
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
      let el;
      if (data.type === 'container') el = createContainer(data);
      else el = createCard(data);
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
