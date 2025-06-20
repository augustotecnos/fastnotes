import * as Store from "../store.js";
import { create as createCard } from "./card.js";
import { t } from "../i18n.js";
import interact from "interactjs";
import Sortable from "sortablejs";

const MAX_COLS = 12;
const MIN_CARD_WIDTH_PX = 300;
const MAX_CARD_WIDTH_PX = 400;
const MIN_CARD_HEIGHT_PX = 200;
const MAX_CARD_HEIGHT_PX = 200;

export function create(data = {}) {
  const item = {
    type: "container-native",
    title: data.title || t("containerDefault"),
    children: data.children || [],
    layout: data.layout || [],
    collapsed: data.collapsed || false,
    id: data.id,
    parent: data.parent || "root",
  };
  const id = Store.upsert(item);

  const wrapper = document.createElement("div");
  wrapper.setAttribute("gs-id", id);
  wrapper.dataset.parent = item.parent;
  wrapper.innerHTML = `
    <div class="grid-stack-item-content container">
      <div class="collapse__header">
        <button class="toggle" aria-label="Toggle">▾</button>
        <h6 contenteditable="true"></h6>
        <button class="add-card" aria-label="Add card">+</button>
        <button class="delete" aria-label="Delete">🗑️</button>
      </div>
      <div class="collapse__body">
        <div class="card-wrapper">
          <div class="native-grid"></div>
        </div>
      </div>
    </div>`;

  const content = wrapper.firstElementChild;
  const titleEl = content.querySelector("h6");
  const toggleBtn = content.querySelector("button.toggle");
  const addBtn = content.querySelector("button.add-card");
  const delBtn = content.querySelector("button.delete");
  const bodyEl = content.querySelector(".collapse__body");
  const wrapperEl = content.querySelector(".card-wrapper");
  const gridEl = content.querySelector(".native-grid");

  const sortable = new Sortable(gridEl, {
    animation: 150,
    onEnd() {
      saveChildren();
      adjustHeight();
    },
  });

  toggleBtn.setAttribute("aria-label", t("toggle"));
  addBtn.setAttribute("aria-label", t("addCard"));
  delBtn.setAttribute("aria-label", t("delete"));

  titleEl.textContent = item.title;
  titleEl.addEventListener("input", () => {
    Store.patch(id, { title: titleEl.textContent });
  });

  function updateColumns() {
    const parentGrid = wrapper.closest(".grid-stack")?.gridstack;
    if (!parentGrid) return;
    if (bodyEl.style.display === "none") return;
    const width = gridEl.clientWidth;
    if (!width) return;
    let cols = Math.floor(width / MIN_CARD_WIDTH_PX);
    cols = Math.max(1, Math.min(MAX_COLS, cols));
    gridEl.style.setProperty("--cols", cols);
    gridEl.style.gridAutoRows = `${MIN_CARD_HEIGHT_PX}px`;
    Array.from(gridEl.children).forEach((c) => autoHeight(c));
    adjustHeight();
  }

  const ro = new ResizeObserver(updateColumns);
  ro.observe(gridEl);
  setTimeout(() => {
    updateColumns();
    restoreChildren();
    adjustHeight();
  });


  addBtn.addEventListener("click", () => {
    const el = createCard({ parent: id });
    gridEl.appendChild(el);
    initCard(el);
    autoHeight(el);
    saveChildren();
    adjustHeight();
  });

  delBtn.addEventListener("click", () => {
    const g = wrapper.closest(".grid-stack")?.gridstack;
    if (g) g.removeWidget(wrapper);
    Store.remove(id);
  });

  wrapper.addEventListener("childadded", (e) => {
    const el = e.detail.el;
    if (!gridEl.contains(el)) {
      gridEl.appendChild(el);
      initCard(el);
      autoHeight(el);
      saveChildren();
      adjustHeight();
    }
  });

  // dragover/drop handled by interact.js

  gridEl.addEventListener("removed", () => {
    saveChildren();
    adjustHeight();
  });

  function restoreChildren() {
    if (item.layout.length && !item.children.length) {
      item.layout.forEach((opts) => {
        const child = Store.data.items[opts.id];
        if (!child) return;
        item.children.push(opts.id);
      });
      Store.patch(id, { children: item.children });
    }
    if (item.children.length) {
      gridEl.innerHTML = "";
      item.children.forEach((cid) => {
        const child = Store.data.items[cid];
        if (!child) return;
        const opts = item.layout.find((o) => o.id === cid) || { w: 1, h: 1 };
        const el = createCard(child);
        gridEl.appendChild(el);
        initCard(el, opts);
        autoHeight(el);
      });
    }
  }

  function initCard(el, opts = {}) {
    el.dataset.w = opts.w || 1;
    el.dataset.h = opts.h || 1;
    applySize(el);
    interact(el)
      .resizable({
        edges: { bottom: true, right: true },
        modifiers: [
          interact.modifiers.restrictSize({
            min: { width: MIN_CARD_WIDTH_PX, height: MIN_CARD_HEIGHT_PX },
            max: { width: MAX_CARD_WIDTH_PX, height: MAX_CARD_HEIGHT_PX },
          }),
        ],
        listeners: {
          move(event) {
            const cell = MIN_CARD_HEIGHT_PX;
            const w = Math.max(1, Math.round(event.rect.width / cell));
            const h = Math.max(1, Math.round(event.rect.height / cell));
            el.dataset.w = w;
            el.dataset.h = h;
            applySize(el);
            adjustHeight();
          },
          end() {
            saveChildren();
          },
        },
      });
    el.addEventListener("moveout", onMoveOut);
    const textarea = el.querySelector("textarea");
    if (textarea) textarea.addEventListener("input", () => autoHeight(el));
  }

  function applySize(el) {
    el.style.gridColumnEnd = `span ${el.dataset.w}`;
    el.style.gridRowEnd = `span ${el.dataset.h}`;
  }

  function autoHeight(el) {
    const content = el.firstElementChild;
    const newH = Math.max(1, Math.ceil(content.offsetHeight / MIN_CARD_HEIGHT_PX));
    if (newH !== parseInt(el.dataset.h)) {
      el.dataset.h = newH;
      applySize(el);
      saveChildren();
      adjustHeight();
    }
  }

  // resizing handled by interact.js

  function onMoveOut(e) {
    const el = e.currentTarget;
    const rootGrid = document.getElementById("grid")?.gridstack;
    if (!rootGrid) return;
    gridEl.removeChild(el);
    rootGrid.addWidget(el, { x: 0, y: 0, w: 3, h: 2 });
    Store.setParent(el.getAttribute("gs-id"), "root");
    saveChildren();
    saveRootLayout();
  }

  function saveRootLayout() {
    const rootGrid = document.getElementById("grid")?.gridstack;
    if (rootGrid) {
      Store.data.layout = rootGrid.save();
      Store.save();
    }
  }

  function saveChildren() {
    const arr = Array.from(gridEl.children).map((c) => ({
      id: c.getAttribute("gs-id"),
      w: parseInt(c.dataset.w || 1),
      h: parseInt(c.dataset.h || 1),
    }));
    item.layout = arr;
    item.children = arr.map((o) => o.id);
    Store.patch(id, { children: item.children, layout: item.layout });
  }

  function setCollapsed(flag) {
    bodyEl.style.display = flag ? "none" : "";
    content.style.minHeight = flag ? "100px" : "";
    toggleBtn.textContent = flag ? "▸" : "▾";
    item.collapsed = flag;
    content.classList.toggle("collapsed", flag);
    Store.patch(id, { collapsed: flag });
    setTimeout(() => {
      adjustHeight();
      if (!flag) updateColumns();
    }, 300);
  }

  toggleBtn.addEventListener("click", () => setCollapsed(!item.collapsed));

  function adjustHeight() {
    const parentGrid = wrapper.closest(".grid-stack")?.gridstack;
    if (!parentGrid) return;
    const cellH = parentGrid.getCellHeight();
    if (!cellH) return;
    const newH = Math.max(1, Math.ceil(content.offsetHeight / cellH));
    parentGrid.update(wrapper, { h: newH });
    parentGrid.save();
  }

  setCollapsed(item.collapsed);

  return { el: wrapper, adjust: adjustHeight, setCollapsed };
}
