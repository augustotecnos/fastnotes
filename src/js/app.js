import { GridStack } from 'gridstack';
import * as Store from './store.js';
import { create as createCard } from './ui/card.js';

const grid = GridStack.init(
  { column: 12, float: false, resizable: { handles: 'e, se, s, w' } },
  '#grid'
);
grid.on('change', saveLayout);

function updateColumns() {
  const width = window.innerWidth;
  let cols = 12;
  if (width < 600) cols = 3;
  else if (width < 1024) cols = 6;
  if (grid.opts.column !== cols) grid.column(cols);
}
window.addEventListener('resize', updateColumns);
updateColumns();

document.addEventListener('keydown', navigateCards);

function navigateCards(e){
  const cards = Array.from(document.querySelectorAll('.grid-stack-item-content'));
  const idx = cards.indexOf(document.activeElement);
  if (idx === -1) return;
  if (['ArrowRight','ArrowDown'].includes(e.key)){
    const next = cards[idx+1];
    if (next){ next.focus(); e.preventDefault(); }
  } else if (['ArrowLeft','ArrowUp'].includes(e.key)){
    const prev = cards[idx-1];
    if (prev){ prev.focus(); e.preventDefault(); }
  } else if (e.key === 'Enter'){
    const first = document.activeElement.querySelector('h6[contenteditable]') ||
                  document.activeElement.querySelector('textarea');
    if (first){ first.focus(); e.preventDefault(); }
  }
}

document.getElementById('fab-add').addEventListener('click', addCard);

function addCard(data={x:0,y:0,w:3,h:2}){
  const el = createCard({});
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
      const el = createCard(Store.data.items[opts.id] || {});
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
