import * as Store from "../store.js";
import { create as createCard } from "./card.js";
import { t } from "../i18n.js";

class Container {
  constructor(data = {}) {
    this.item = {
      type: "container",
      title: data.title || t("containerDefault"),
      children: data.children || [],
      collapsed: data.collapsed || false,
      id: data.id,
      parent: data.parent || "root",
    };

    this.id = Store.upsert(this.item);
    this.wrapper = document.createElement("div");
    this.wrapper.setAttribute("gs-id", this.id);
    this.wrapper.dataset.parent = this.item.parent;
    this.wrapper.innerHTML = `
      <div class="grid-stack-item-content container">
        <div class="container-header">
          <button class="toggle" aria-label="${t("toggle")}">▾</button>
          <h6 contenteditable="true"></h6>
          <button class="add-card" aria-label="${t("addCard")}">+</button>
          <button class="delete" aria-label="${t("delete")}">🗑️</button>
        </div>
        <div class="container-body native-grid"></div>
      </div>`;

    this.content = this.wrapper.firstElementChild;
    this.titleEl = this.content.querySelector("h6");
    this.bodyEl = this.content.querySelector(".container-body");
    this.toggleBtn = this.content.querySelector("button.toggle");
    this.addBtn = this.content.querySelector("button.add-card");
    this.deleteBtn = this.content.querySelector("button.delete");

    this.titleEl.textContent = this.item.title;
    this.titleEl.addEventListener("input", () => {
      Store.patch(this.id, { title: this.titleEl.textContent });
    });

    this.toggleBtn.addEventListener("click", () =>
      this.setCollapsed(!this.item.collapsed),
    );
    this.addBtn.addEventListener("click", () => this.addCard());
    this.deleteBtn.addEventListener("click", () => this.remove());

    this.wrapper.addEventListener("childadded", (e) => {
      const el = e.detail.el;
      if (!this.bodyEl.contains(el)) {
        this.bodyEl.appendChild(el);
        this.item.children.push(el.getAttribute("gs-id"));
        Store.patch(this.id, { children: this.item.children });
        this.adjustHeight();
      }
    });

    this.bodyEl.addEventListener("removed", () => {
      this.item.children = Array.from(this.bodyEl.children).map((c) =>
        c.getAttribute("gs-id"),
      );
      Store.patch(this.id, { children: this.item.children });
      this.adjustHeight();
    });

    this.restoreChildren();
    this.setCollapsed(this.item.collapsed);
  }

  addCard() {
    const el = createCard({ parent: this.id });
    this.bodyEl.appendChild(el);
    this.item.children.push(el.getAttribute("gs-id"));
    Store.patch(this.id, { children: this.item.children });
    this.adjustHeight();
  }

  adjustHeight() {
    const parentGrid = this.wrapper.closest(".grid-stack")?.gridstack;
    if (!parentGrid) return;
    const cellH = parentGrid.getCellHeight();
    if (!cellH) return;
    const newH = Math.max(1, Math.ceil(this.content.scrollHeight / cellH));
    parentGrid.update(this.wrapper, { h: newH });
    parentGrid.save();
  }

  setCollapsed(flag) {
    this.item.collapsed = flag;
    this.bodyEl.style.display = flag ? "none" : "";
    this.toggleBtn.textContent = flag ? "▸" : "▾";
    this.content.classList.toggle("collapsed", flag);
    Store.patch(this.id, { collapsed: flag });
    this.adjustHeight();
  }

  remove() {
    const g = this.wrapper.closest(".grid-stack")?.gridstack;
    if (g) g.removeWidget(this.wrapper);
    Store.remove(this.id);
  }

  restoreChildren() {
    if (!this.item.children.length) return;
    this.bodyEl.innerHTML = "";
    this.item.children.forEach((cid) => {
      const child = Store.data.items[cid];
      if (!child) return;
      const el = createCard(child);
      this.bodyEl.appendChild(el);
    });
  }

  reset() {
    this.item.children = [];
    this.bodyEl.innerHTML = "";
    Store.patch(this.id, { children: [] });
    this.setCollapsed(false);
    this.adjustHeight();
  }
}

export function create(data) {
  const c = new Container(data);
  return {
    el: c.wrapper,
    adjust: () => c.adjustHeight(),
    setCollapsed: (f) => c.setCollapsed(f),
    reset: () => c.reset(),
  };
}

