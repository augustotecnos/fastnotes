import * as Store from "../store.js";
import { create as createCard } from "./card.js";
import { t } from "../i18n.js";

export function create(data = {}) {
  const item = {
    type: "container",
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
      <div class="container-header">
        <button class="toggle" aria-label="${t("toggle")}">▾</button>
        <h6 contenteditable="true"></h6>
        <button class="add-card" aria-label="${t("addCard")}">+</button>
        <button class="delete" aria-label="${t("delete")}">🗑️</button>
      </div>
      <div class="container-body native-grid"></div>
    </div>`;

  const content = wrapper.firstElementChild;
  const titleEl = content.querySelector("h6");
  const bodyEl = content.querySelector(".container-body");
  const toggleBtn = content.querySelector("button.toggle");
  const addBtn = content.querySelector("button.add-card");
  const delBtn = content.querySelector("button.delete");

  titleEl.textContent = item.title;
  titleEl.addEventListener("input", () => {
    Store.patch(id, { title: titleEl.textContent });
  });

  addBtn.addEventListener("click", () => {
    const el = createCard({ parent: id });
    bodyEl.appendChild(el);
    item.children.push(el.getAttribute("gs-id"));
    Store.patch(id, { children: item.children });
    adjustHeight();
  });

  delBtn.addEventListener("click", () => {
    const g = wrapper.closest(".grid-stack")?.gridstack;
    if (g) g.removeWidget(wrapper);
    Store.remove(id);
  });

  wrapper.addEventListener("childadded", (e) => {
    const el = e.detail.el;
    if (!bodyEl.contains(el)) {
      bodyEl.appendChild(el);
      item.children.push(el.getAttribute("gs-id"));
      Store.patch(id, { children: item.children });
      adjustHeight();
    }
  });

  bodyEl.addEventListener("removed", () => {
    item.children = Array.from(bodyEl.children).map((c) => c.getAttribute("gs-id"));
    Store.patch(id, { children: item.children });
    adjustHeight();
  });

  function restoreChildren() {
    if (item.children.length) {
      bodyEl.innerHTML = "";
      item.children.forEach((cid) => {
        const child = Store.data.items[cid];
        if (!child) return;
        const el = createCard(child);
        bodyEl.appendChild(el);
      });
    }
  }

  function setCollapsed(flag) {
    item.collapsed = flag;
    bodyEl.style.display = flag ? "none" : "";
    toggleBtn.textContent = flag ? "▸" : "▾";
    content.classList.toggle("collapsed", flag);
    Store.patch(id, { collapsed: flag });
    adjustHeight();
  }

  toggleBtn.addEventListener("click", () => setCollapsed(!item.collapsed));

  function adjustHeight() {
    const parentGrid = wrapper.closest(".grid-stack")?.gridstack;
    if (!parentGrid) return;
    const cellH = parentGrid.getCellHeight();
    if (!cellH) return;
    const newH = Math.max(1, Math.ceil(content.scrollHeight / cellH));
    parentGrid.update(wrapper, { h: newH });
    parentGrid.save();
  }

  restoreChildren();
  setCollapsed(item.collapsed);

  return { el: wrapper, adjust: adjustHeight, setCollapsed };
}
