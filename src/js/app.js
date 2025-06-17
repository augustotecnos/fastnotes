import { GridStack } from 'gridstack';
import * as Store from './store.js';
import { create as createCard } from './ui/card.js';
import { registerDriveSync } from './drive/sync.js';

import * as Auth from './drive/auth.js';
import * as Drive from './drive/sync.js';

import { t, getLanguage } from './i18n.js';


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

document.getElementById('btn-export').addEventListener('click', Store.exportJSON);
document.getElementById('btn-import').addEventListener('click', () =>
  document.getElementById('import-file').click()
);
document.getElementById('import-file').addEventListener('change', async e => {
  if (!e.target.files.length) return;
  await Store.importJSON(e.target.files[0]);
  location.reload();

const authBtn = document.getElementById('auth-btn');
authBtn.addEventListener('click', async () => {
  if (Auth.isSignedIn()) {
    Auth.signOut();
    authBtn.textContent = 'Login';
  } else {
    try {
      await Auth.signIn();
      authBtn.textContent = 'Logout';
      await Store.sync();
    } catch (e) {
      console.error(e);
    }
  }

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

async function start() {
  await Auth.init();
  authBtn.textContent = Auth.isSignedIn() ? 'Logout' : 'Login';
  if (Auth.isSignedIn()) {
    try {
      const remote = await Drive.download();
      if (remote && remote.updated) {
        const local = localStorage.getItem('fastnotes-json');
        const localData = local ? JSON.parse(local) : null;
        if (!localData || remote.updated > localData.updated) {
          localStorage.setItem('fastnotes-json', JSON.stringify(remote));
        }
      }
    } catch (e) {
      console.error('Drive download failed', e);
    }
  }
  await restore();
}

start();

// Register service worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
  registerDriveSync();
}
