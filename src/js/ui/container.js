import { GridStack } from "gridstack";
import * as Store from "../store.js";
import { create as createCard } from "./card.js";
import { t } from "../i18n.js";
import { TITLE_MAX_LENGTH } from "../constants.js";

export function create(data = {}) {
  const item = {
    type: "container",
    title: data.title || t("containerDefault"),
    children: data.children || [],
    layout: data.layout || [],
    collapsed: data.collapsed || false,
    expandedH: data.expandedH,
    width: data.width,
    id: data.id,
    parent: data.parent || "root",
  };
  const id = Store.upsert(item);

  const wrapper = document.createElement("div");
  wrapper.setAttribute("gs-id", id);
  wrapper.dataset.parent = item.parent;
  wrapper.dataset.type = "container";
  wrapper.innerHTML = `
    <div class="grid-stack-item-content container">
      <div class="container-header">
        <button class="toggle" aria-label="${t("toggle")}">▾</button>
        <span class="lock-indicator" style="display:none">🔒</span>
        <h6 contenteditable="true"></h6>
        <button class="add-card" aria-label="${t("addCard")}">➕</button>
        <button class="delete" aria-label="${t("delete")}">🗑️</button>
      </div>
      <div class="container-body">
        <div class="grid-stack subgrid"></div>
      </div>
    </div>
  `;

  const content = wrapper.firstElementChild;
  content.classList.add("fixed-width");
  const titleEl = content.querySelector("h6");
  const toggleBtn = content.querySelector("button.toggle");
  const lockEl = content.querySelector(".lock-indicator");
  const addBtn = content.querySelector("button.add-card");
  const delBtn = content.querySelector("button.delete");
  const body = content.querySelector(".container-body");
  const subEl = content.querySelector(".subgrid");

  titleEl.textContent = item.title;
  titleEl.addEventListener("input", () => {
    const text = titleEl.textContent.slice(0, TITLE_MAX_LENGTH);
    if (text !== titleEl.textContent) titleEl.textContent = text;
    item.title = text;
    Store.patch(id, { title: text });
  });

  const subgrid = GridStack.init(
    {
      // use the same total 10px gap as the main grid
      margin: 5,
      column: "auto",
      float: false,
      resizable: { handles: "e, se, s, w" },
      acceptWidgets: true,
      dragOut: true,
      subGrid: true,
    },
    subEl,
  );

  function save() {
    item.layout = subgrid.save();
    item.children = item.layout.map((c) => c.id);
    Store.patch(id, {
      layout: item.layout,
      children: item.children,
      collapsed: item.collapsed,
      expandedH: item.expandedH,
      title: item.title,
      width: item.width,
    });
  }

  function applyCollapsed(flag) {
    const g = wrapper.closest(".grid-stack")?.gridstack;
    if (!g) return;
    const cols = g.opts.column;
    const cell = g.getCellHeight(true);
    const targetRows = Math.max(1, Math.round(120 / cell));
    if (flag) {
      item.expandedH = wrapper.gridstackNode?.h || item.expandedH || 4;
      item.width = cols;
      g.update(wrapper, { h: targetRows, w: cols, minW: cols, maxW: cols });
      wrapper.style.height = "120px";
      body.style.display = "none";
      toggleBtn.textContent = "▸";
      lockEl.style.display = "inline";
    } else {
      const h = item.expandedH || wrapper.gridstackNode?.h || 4;
      item.width = cols;
      g.update(wrapper, { h, w: cols, minW: cols, maxW: cols });
      wrapper.style.height = "";
      body.style.display = "";
      toggleBtn.textContent = "▾";
      lockEl.style.display = "none";
    }
    save();
  }

  toggleBtn.addEventListener("click", () => {
    item.collapsed = !item.collapsed;
    applyCollapsed(item.collapsed);
  });

  addBtn.addEventListener("click", () => {
    const el = createCard({ parent: id });
    subgrid.addWidget(el, { w: 1, h: 1, autoPosition: true });
    save();
  });

  delBtn.addEventListener("click", () => {
    const g = wrapper.closest(".grid-stack")?.gridstack;
    if (g) g.removeWidget(wrapper);
    Store.trash(id);
  });

  subgrid.on("change", save);

  if (item.layout.length) {
    item.layout.forEach((opts) => {
      const child = Store.data.items[opts.id];
      if (!child || child.type !== "card") return;
      const el = createCard(child);
      subgrid.addWidget(el, opts);
    });
  } else if (item.children.length) {
    item.children.forEach((cid) => {
      const child = Store.data.items[cid];
      if (!child || child.type !== "card") return;
      const el = createCard(child);
      subgrid.addWidget(el, { w: 1, h: 1, autoPosition: true });
    });
  }

  if (item.collapsed) {
    // apply collapsed state after element is added to the grid
    setTimeout(() => applyCollapsed(true));
  }

  return { el: wrapper };
}
