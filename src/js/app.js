import { GridStack } from 'gridstack';
import * as Store from './store.js';
import { create as createCard } from './ui/card.js';
import { create as createContainer } from './ui/container.js';
import { create as createFolder } from './ui/folder.js';
import { registerDriveSync } from './drive/sync.js';
import * as Auth from './drive/auth.js';
import * as Drive from './drive/sync.js';
import { t, getLanguage } from './i18n.js';

let dragItem = null;

function attachGridEvents(g) {
  g.on('dragstart', (_e, el) => {
    dragItem = { id: el.getAttribute('gs-id') };
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
  { column: 12, float: false, resizable: { handles: 'e, se, s, w' }, acceptWidgets: true, dragOut: true },
  '#grid'
);
grid.on('change', saveLayout);

attachGridEvents(grid);

const fab = document.getElementById('fab');
const fabMain = document.getElementById('fab-main');
const fabCard = document.getElementById('fab-card');
const fabContainerBtn = document.getElementById('fab-container');
const fabFolderBtn = document.getElementById('fab-folder');

fabMain.addEventListener('click', toggleMenu);
fabCard.addEventListener('click', () => { addCard(); toggleMenu(false); });
fabContainerBtn.addEventListener('click', () => { addContainer(); toggleMenu(false); });
fabFolderBtn.addEventListener('click', () => { addFolder(); toggleMenu(false); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(false); });

toggleMenu(false);

document.getElementById('fab-add')?.addEventListener('click', addCard);
document.getElementById('btn-export')?.addEventListener('click', Store.exportJSON);
document.getElementById('btn-import')?.addEventListener('click', () =>
  document.getElementById('import-file').click()
);
document.getElementById('import-file')?.addEventListener('change', async e => {
  if (!e.target.files.length) return;
  await Store.importJSON(e.target.files[0]);
  location.reload();
});

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

function toggleMenu(force) {
  const open = typeof force === 'boolean' ? force : !fab.classList.contains('open');
  fab.classList.toggle('open', open);
  [fabCard, fabContainerBtn, fabFolderBtn].forEach(btn => btn.disabled = !open);
  if (open) fabCard.focus();
}

function addCard(data = { x: 0, y: 0, w: 3, h: 2 }, g = grid, parent = 'root') {
  const el = createCard({ parent });
  g.addWidget(el, data);
  if (g === grid) saveLayout();
}

function addContainer(data = { x: 0, y: 0, w: 6, h: 4 }) {
  const added = createContainer({});
  grid.addWidget(added.el, data);
  attachGridEvents(added.grid);
  added.adjust();
  saveLayout();
}

function addFolder(data = { x: 0, y: 0, w: 3, h: 3 }) {
  const el = createFolder({});
  grid.addWidget(el, data);
  saveLayout();
}

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

function navigateCards(e) {
  const cards = Array.from(document.querySelectorAll('.grid-stack-item-content'));
  const idx = cards.indexOf(document.activeElement);
  if (idx === -1) return;
  if (['ArrowRight', 'ArrowDown'].includes(e.key)) {
    const next = cards[idx + 1];
    if (next) { next.focus(); e.preventDefault(); }
  } else if (['ArrowLeft', 'ArrowUp'].includes(e.key)) {
    const prev = cards[idx - 1];
    if (prev) { prev.focus(); e.preventDefault(); }
  } else if (e.key === 'Enter') {
    const first = document.activeElement.querySelector('h6[contenteditable]') ||
                  document.activeElement.querySelector('textarea');
    if (first) { first.focus(); e.preventDefault(); }
  }
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
        added.adjust();
      } else if (data.type === 'folder') {
        const el = createFolder(data);
        grid.addWidget(el, opts);
      } else {
        const el = createCard(data);
        grid.addWidget(el, opts);
      }
    });
  } else if (!localStorage.getItem('fastnotes-json')) {
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js');
  });
  registerDriveSync();
}
