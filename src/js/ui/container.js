import { GridStack } from "gridstack";
import * as Store from "../store.js";
import { create as createCard } from "./card.js";
import { t } from "../i18n.js";

// Base width/height for cards within a container
const CARD_SIZE = 300;

export function create(data = {}) {
  const item = {
    type: "container",
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
        <div class="grid-stack subgrid" id="sub-${id}"></div>
      </div>
    </div>`;
  const content = wrapper.firstElementChild;
  const titleEl = content.querySelector("h6");
  const toggleBtn = content.querySelector("button.toggle");
  const addBtn = content.querySelector("button.add-card");
  const delBtn = content.querySelector("button.delete");
  const bodyEl = content.querySelector(".collapse__body");
  const subEl = content.querySelector(".subgrid");

  toggleBtn.setAttribute("aria-label", t("toggle"));
  addBtn.setAttribute("aria-label", t("addCard"));
  delBtn.setAttribute("aria-label", t("delete"));

  titleEl.textContent = item.title;
  titleEl.addEventListener("input", () => {
    Store.patch(id, { title: titleEl.textContent });
  });

  const subgrid = GridStack.init(
    {
      margin: 8,
      column: 1,
      float: false,
      acceptWidgets: true,
      dragOut: true,
      subGrid: true,
      disableResize: true,
      cellHeight: CARD_SIZE,
    },
    subEl,
  );
  function updateColumns() {
    if (bodyEl.style.display === "none") return;
    const width = subEl.clientWidth;
    let cols = Math.floor(width / CARD_SIZE);
    cols = Math.max(1, cols);
    if (subgrid.opts.column !== cols) subgrid.column(cols);
    if (subgrid.opts.cellHeight !== CARD_SIZE) subgrid.cellHeight(CARD_SIZE);
    adjustHeight();
  }
  const ro = new ResizeObserver(updateColumns);
  ro.observe(subEl);
  setTimeout(() => {
    updateColumns();
    restoreChildren();
    adjustHeight();
  });
  subgrid.on("change", () => {
    item.layout = subgrid.save();
    Store.patch(id, { layout: item.layout });
    adjustHeight();
  });

  addBtn.addEventListener("click", () => {
    const el = createCard({ parent: id });
    subgrid.addWidget(el, { x: 0, y: 0, w: 1, h: 1 });
  });

  delBtn.addEventListener("click", () => {
    const g = wrapper.closest(".grid-stack")?.gridstack;
    if (g) g.removeWidget(wrapper);
    Store.remove(id);
  });

  function restoreChildren() {
    if (item.layout.length) {
      subgrid.removeAll();
      item.layout.forEach((opts) => {
        const child = Store.data.items[opts.id];
        if (!child) return;
        let el;
        if (child.type === "card") el = createCard(child);
        if (el)
          subgrid.addWidget(el, { x: opts.x, y: opts.y, w: 1, h: 1, id: opts.id });
      });
    } else if (item.children.length) {
      item.children.forEach((cid) => {
        const child = Store.data.items[cid];
        if (!child) return;
        const el = createCard(child);
        subgrid.addWidget(el, { x: 0, y: 0, w: 1, h: 1 });
      });
    }
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

  return { el: wrapper, grid: subgrid, adjust: adjustHeight, setCollapsed };
}
