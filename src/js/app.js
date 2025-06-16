import { GridStack } from 'gridstack';
import * as Store from './store.js';
import { create as createCard } from './ui/card.js';

const grid = GridStack.init(
  { column: 12, float: false, resizable: { handles: 'e, se, s, w' } },
  '#grid'
);
grid.on('change', saveLayout);

document.getElementById('fab-add').addEventListener('click', addCard);
document.getElementById('btn-export').addEventListener('click', Store.exportJSON);
document.getElementById('btn-import').addEventListener('click', () =>
  document.getElementById('import-file').click()
);
document.getElementById('import-file').addEventListener('change', async e => {
  if (!e.target.files.length) return;
  await Store.importJSON(e.target.files[0]);
  location.reload();
});

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
