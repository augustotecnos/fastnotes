import { GridStack } from "gridstack";
import * as Store from "./store.js";
import { create as createCard } from "./ui/card.js";
import { create as createContainer } from "./ui/container.js";
import { create as createFolder } from "./ui/folder.js";
import { registerDriveSync } from "./drive/sync.js";
import * as Auth from "./drive/auth.js";
import * as Drive from "./drive/sync.js";
import { t, getLanguage } from "./i18n.js";

let dragItem = null;

function attachGridEvents(g) {
  g.on("dragstart", (_e, el) => {
    dragItem = { id: el.getAttribute("gs-id") };
  });

  g.on("dropped", (_e, prev, node) => {
    const el = document.querySelector(`[gs-id="${node.id}"]`);
    if (!el) return;
    const parentId = g.el.closest("[gs-id]")?.getAttribute("gs-id") || "root";
    el.dataset.parent = parentId;
    Store.setParent(node.id, parentId);
    Store.save();
    if (g === grid) saveLayout();
  });

  g.on("resizestop", (_e, el) => {
    if (g === grid) saveLayout();
  });
}

const grid = GridStack.init(
  {
    // vertical gap between widgets (horizontal spacing handled by CSS)
    margin: "5px 0",
    column: 12,
    float: false,
    resizable: { handles: "e, se, s, w" },
    acceptWidgets: true,
    dragOut: true,
  },
  "#grid",
);
grid.on("change", saveLayout);

attachGridEvents(grid);

const fab = document.getElementById("fab");
const fabMain = document.getElementById("fab-main");
const fabCard = document.getElementById("fab-card");
const fabContainerBtn = document.getElementById("fab-container");
const fabFolderBtn = document.getElementById("fab-folder");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");
const menuToggle = document.getElementById("menu-toggle");

menuToggle.addEventListener("click", () => openSidebar(true));
sidebarOverlay.addEventListener("click", () => openSidebar(false));

fabMain.addEventListener("click", toggleMenu);
fabCard.addEventListener("click", () => {
  addCard();
  toggleMenu(false);
});
fabContainerBtn.addEventListener("click", () => {
  addContainer();
  toggleMenu(false);
});
fabFolderBtn.addEventListener("click", () => {
  addFolder();
  toggleMenu(false);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    toggleMenu(false);
    openSidebar(false);
  }
});

toggleMenu(false);
openSidebar(false);

document.getElementById("fab-add")?.addEventListener("click", addCard);
document
  .getElementById("btn-export")
  ?.addEventListener("click", Store.exportJSON);
document
  .getElementById("btn-import")
  ?.addEventListener("click", () =>
    document.getElementById("import-file").click(),
  );
document
  .getElementById("import-file")
  ?.addEventListener("change", async (e) => {
    if (!e.target.files.length) return;
    await Store.importJSON(e.target.files[0]);
    location.reload();
  });
document.getElementById("btn-trash")?.addEventListener("click", openTrash);

const authBtn = document.getElementById("auth-btn");
authBtn.addEventListener("click", async () => {
  if (Auth.isSignedIn()) {
    Auth.signOut();
    authBtn.textContent = "Login";
  } else {
    try {
      await Auth.signIn();
      authBtn.textContent = "Logout";
      await Store.sync();
    } catch (e) {
      console.error(e);
    }
  }
});

function toggleMenu(force) {
  const open =
    typeof force === "boolean" ? force : !fab.classList.contains("open");
  fab.classList.toggle("open", open);
  [fabCard, fabContainerBtn, fabFolderBtn].forEach(
    (btn) => (btn.disabled = !open),
  );
  if (open) fabCard.focus();
}

function openSidebar(open = true) {
  sidebar.classList.toggle("open", open);
  sidebarOverlay.classList.toggle("show", open);
}

function addCard(data = {}, g = grid, parent = "root") {
  const el = createCard({ parent });
  const opts = { w: 3, h: 2, ...data };
  if (opts.y === undefined) opts.y = g.getRow();
  if (opts.x === undefined) opts.x = 0;
  g.addWidget(el, opts);
  if (g === grid) saveLayout();
}

function addContainer(data = {}) {
  const cols = grid.opts.column;
  if (!data.width) data.width = cols;
  const added = createContainer(data);
  const opts = {
    x: data.x ?? 0,
    y: data.y ?? grid.getRow(),
    w: data.w ?? data.width,
    h: data.h ?? 4,
    minW: data.width,
    maxW: data.width,
    resizable: { handles: "s" },
  };
  grid.addWidget(added.el, opts);
  const id = added.el.getAttribute("gs-id");
  const item = Store.data.items[id];
  if (item) item.width = data.width;
  Store.save();
  saveLayout();
}

function addFolder(data = {}) {
  const el = createFolder({});
  const opts = { w: 3, h: 3, ...data };
  if (opts.y === undefined) opts.y = grid.getRow();
  if (opts.x === undefined) opts.x = 0;
  grid.addWidget(el, opts);
  saveLayout();
}

function openTrash() {
  openSidebar(false);
  const overlay = document.createElement("div");
  overlay.className = "trash-overlay";
  overlay.innerHTML = `
    <div class="trash-box">
      <h3>${t("trash")}</h3>
      <ul class="trash-list"></ul>
      <button class="trash-close">${t("close")}</button>
    </div>`;
  document.body.appendChild(overlay);
  const listEl = overlay.querySelector(".trash-list");
  const closeBtn = overlay.querySelector(".trash-close");

  Object.values(Store.data.trash).forEach((item) => {
    const li = document.createElement("li");
    li.className = "trash-item";
    li.textContent = item.title || item.id;
    const restoreBtn = document.createElement("button");
    restoreBtn.textContent = t("restore");
    const delBtn = document.createElement("button");
    delBtn.textContent = t("delete");
    li.appendChild(restoreBtn);
    li.appendChild(delBtn);
    listEl.appendChild(li);

    restoreBtn.addEventListener("click", () => {
      const restored = Store.restore(item.id);
      if (restored) {
        if (restored.type === "card") addCard(restored);
        else if (restored.type === "container") addContainer(restored);
        else if (restored.type === "folder") addFolder(restored);
        li.remove();
        saveLayout();
      }
    });

    delBtn.addEventListener("click", () => {
      Store.remove(item.id);
      li.remove();
    });
  });

  closeBtn.addEventListener("click", () => overlay.remove());
}

function updateColumns() {
  const width = window.innerWidth;
  let cols = 12;
  if (width < 600) cols = 3;
  else if (width < 1024) cols = 6;
  if (grid.opts.column !== cols) {
    grid.column(cols);
    document.querySelectorAll('[data-type="container"]').forEach((el) => {
      grid.update(el, { w: cols, minW: cols, maxW: cols });
      const id = el.getAttribute("gs-id");
      const item = Store.data.items[id];
      if (item) item.width = cols;
    });
    Store.save();
  }
}
window.addEventListener("resize", updateColumns);
updateColumns();

document.addEventListener("keydown", navigateCards);

// handle moving cards from root into a container
grid.el.addEventListener("movein", (e) => {
  const cardEl = e.target;
  const containers = Object.values(Store.data.items).filter(
    (i) => i.type === "container",
  );
  if (!containers.length) return;
  let targetId = containers[0].id;
  if (containers.length > 1) {
    const list = containers.map((c) => `${c.id}: ${c.title}`).join("\n");
    const choice = prompt(t("selectContainer") + "\n" + list, targetId);
    const found = containers.find((c) => c.id === choice || c.title === choice);
    if (found) targetId = found.id;
    else return;
  }
  const targetEl = document.querySelector(`[gs-id="${targetId}"]`);
  const sub = targetEl?.querySelector(".subgrid")?.gridstack;
  if (!sub) return;
  grid.removeWidget(cardEl);
  GridStack.Utils.removePositioningStyles(cardEl);
  cardEl.classList.remove("grid-stack-item");
  sub.addWidget(cardEl, { w: 1, h: 1, autoPosition: true });
  cardEl.dataset.parent = targetId;
  Store.setParent(cardEl.getAttribute("gs-id"), targetId);
  saveLayout();
});

function navigateCards(e) {
  const cards = Array.from(
    document.querySelectorAll(".grid-stack-item-content"),
  );
  const idx = cards.indexOf(document.activeElement);
  if (idx === -1) return;
  if (["ArrowRight", "ArrowDown"].includes(e.key)) {
    const next = cards[idx + 1];
    if (next) {
      next.focus();
      e.preventDefault();
    }
  } else if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
    const prev = cards[idx - 1];
    if (prev) {
      prev.focus();
      e.preventDefault();
    }
  } else if (e.key === "Enter") {
    const first =
      document.activeElement.querySelector("h6[contenteditable]") ||
      document.activeElement.querySelector("textarea");
    if (first) {
      first.focus();
      e.preventDefault();
    }
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
    Store.data.layout.forEach((opts) => {
      const data = Store.data.items[opts.id] || {};
      let added;
      if (data.type === "container") {
        added = createContainer(data);
        const width = data.width || opts.w;
        grid.addWidget(added.el, {
          ...opts,
          w: width,
          minW: width,
          maxW: width,
          resizable: { handles: "s" },
        });
        if (data.width !== width) {
          data.width = width;
          Store.patch(data.id, { width });
        }
      } else if (data.type === "folder") {
        const el = createFolder(data);
        grid.addWidget(el, opts);
      } else {
        const el = createCard(data);
        grid.addWidget(el, opts);
      }
    });
  } else if (!localStorage.getItem("fastnotes-json")) {
    addCard({ x: 0, y: 0 });
    addCard({ x: 3, y: 0 });
    addCard({ x: 6, y: 0 });
  }
}

async function start() {
  await Auth.init();
  authBtn.textContent = Auth.isSignedIn() ? "Logout" : "Login";
  if (Auth.isSignedIn()) {
    try {
      const remote = await Drive.download();
      if (remote && remote.updated) {
        const local = localStorage.getItem("fastnotes-json");
        const localData = local ? JSON.parse(local) : null;
        if (!localData || remote.updated > localData.updated) {
          localStorage.setItem("fastnotes-json", JSON.stringify(remote));
        }
      }
    } catch (e) {
      console.error("Drive download failed", e);
    }
  }
  await restore();
  // ensure containers span the full grid width after restoring layout
  updateColumns();
}

start();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js");
  });
  registerDriveSync();
}
