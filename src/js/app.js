import { GridStack } from 'gridstack';
import * as Store from './store.js';
import { create as createCard } from './ui/card.js';
import * as Auth from './drive/auth.js';
import * as Drive from './drive/sync.js';

const grid = GridStack.init(
  { column: 12, float: false, resizable: { handles: 'e, se, s, w' } },
  '#grid'
);
grid.on('change', saveLayout);

document.getElementById('fab-add').addEventListener('click', addCard);
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
    navigator.serviceWorker.register('/src/js/service-worker.js');
  });
}
