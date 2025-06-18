import * as Store from "../store.js";
import { create as createCard } from "./card.js";
import { t } from "../i18n.js";

export function create(data = {}) {
  const item = {
    type: "container-native",
    title: data.title || t("containerDefault"),
    children: data.children || [],
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
      <div class="collapse__body native-grid"></div>
    </div>`;

  const content = wrapper.firstElementChild;
  const titleEl = content.querySelector("h6");
  const toggleBtn = content.querySelector("button.toggle");
  const addBtn = content.querySelector("button.add-card");
  const delBtn = content.querySelector("button.delete");
  const bodyEl = content.querySelector(".collapse__body");
  const gridEl = content.querySelector(".native-grid");

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
    const cellW = parentGrid.cellWidth();
    const width = gridEl.clientWidth;
    let cols = Math.round(width / cellW);
    cols = Math.max(1, Math.min(12, cols));
    gridEl.style.setProperty("--cols", cols);
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
    item.children.push(el.getAttribute("gs-id"));
    Store.patch(id, { children: item.children });
    adjustHeight();
  });

  delBtn.addEventListener("click", () => {
    const g = wrapper.closest(".grid-stack")?.gridstack;
    if (g) g.removeWidget(wrapper);
    Store.remove(id);
  });

  function restoreChildren() {
    if (item.children.length) {
      gridEl.innerHTML = "";
      item.children.forEach((cid) => {
        const child = Store.data.items[cid];
        if (!child) return;
        const el = createCard(child);
        gridEl.appendChild(el);
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
    const newH = Math.max(1, Math.ceil(content.offsetHeight / cellH));
    parentGrid.update(wrapper, { h: newH });
    parentGrid.save();
  }

  setCollapsed(item.collapsed);

  return { el: wrapper, adjust: adjustHeight, setCollapsed };
}

