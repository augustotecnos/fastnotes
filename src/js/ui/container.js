import { GridStack } from "gridstack";
import * as Store from "../store.js";
import { create as createCard } from "./card.js";
import { t } from "../i18n.js";

const MIN_WIDTH = 200;
const DEFAULT_HEIGHT = 300;

class Container {
  constructor(data = {}) {
    this.item = {
      type: "container",
      title: data.title || t("containerDefault"),
      children: data.children || [],
      layout: data.layout || [],
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
        <div class="container-body">
          <div class="grid-stack subgrid"></div>
        </div>
      </div>`;

    this.content = this.wrapper.firstElementChild;
    this.titleEl = this.content.querySelector("h6");
    this.toggleBtn = this.content.querySelector("button.toggle");
    this.addBtn = this.content.querySelector("button.add-card");
    this.delBtn = this.content.querySelector("button.delete");
    this.bodyEl = this.content.querySelector(".container-body");
    this.subEl = this.content.querySelector(".subgrid");

    this.titleEl.textContent = this.item.title;
    this.titleEl.addEventListener("input", () => {
      Store.patch(this.id, { title: this.titleEl.textContent });
    });

    this.toggleBtn.addEventListener("click", () =>
      this.setCollapsed(!this.item.collapsed),
    );
    this.addBtn.addEventListener("click", () => this.addCard());
    this.delBtn.addEventListener("click", () => this.remove());

    this.subgrid = GridStack.init(
      {
        margin: 8,
        column: 1,
        float: false,
        resizable: { handles: "e, se, s, w" },
        acceptWidgets: true,
        dragOut: true,
        subGrid: true,
      },
      this.subEl,
    );

    this.subgrid.on("change", () => {
      this.item.layout = this.subgrid.save();
      Store.patch(this.id, {
        layout: this.item.layout,
        children: this.item.children,
      });
      this.adjustHeight();
    });

    this.wrapper.addEventListener("childadded", (e) => {
      const el = e.detail.el;
      if (!this.subEl.contains(el)) {
        this.subgrid.addWidget(el, { w: 1, h: 1, autoPosition: true });
        this.item.children.push(el.getAttribute("gs-id"));
        Store.patch(this.id, { children: this.item.children });
        this.updateColumns();
        this.adjustHeight();
      }
    });

    this.subEl.addEventListener("removed", () => {
      this.item.layout = this.subgrid.save();
      this.item.children = this.item.layout.map((c) => c.id);
      Store.patch(this.id, {
        children: this.item.children,
        layout: this.item.layout,
      });
      this.updateColumns();
      this.adjustHeight();
    });

    const ro = new ResizeObserver(() => this.updateColumns());
    ro.observe(this.wrapper);
    ro.observe(this.subEl);
    setTimeout(() => {
      this.restoreChildren();
      this.updateColumns();
      this.adjustHeight();
    });

    this.setCollapsed(this.item.collapsed);
  }

  updateColumns() {
    if (this.bodyEl.style.display === "none") return;
    const width = this.subEl.clientWidth;
    let cols = Math.max(1, Math.floor(width / MIN_WIDTH));
    if (this.subgrid.opts.column !== cols) this.subgrid.column(cols);
    const parentGrid = this.wrapper.closest(".grid-stack")?.gridstack;
    const height = parentGrid?.getCellHeight() || DEFAULT_HEIGHT;
    if (this.subgrid.opts.cellHeight !== height)
      this.subgrid.cellHeight(height);
    this.adjustHeight();
  }

  addCard() {
    const el = createCard({ parent: this.id });
    this.subgrid.addWidget(el, { w: 1, h: 1, autoPosition: true });
    this.updateColumns();
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
    this.bodyEl.style.display = flag ? "none" : "";
    this.content.style.minHeight = flag ? "100px" : "";
    this.toggleBtn.textContent = flag ? "▸" : "▾";
    this.item.collapsed = flag;
    this.content.classList.toggle("collapsed", flag);
    Store.patch(this.id, { collapsed: flag });
    setTimeout(() => {
      this.adjustHeight();
      if (!flag) this.updateColumns();
    }, 300);
  }

  remove() {
    const g = this.wrapper.closest(".grid-stack")?.gridstack;
    if (g) g.removeWidget(this.wrapper);
    Store.remove(this.id);
  }

  restoreChildren() {
    if (this.item.layout.length) {
      this.subgrid.removeAll();
      this.item.layout.forEach((opts) => {
        const child = Store.data.items[opts.id];
        if (!child) return;
        let el;
        if (child.type === "card") el = createCard(child);
        if (el)
          this.subgrid.addWidget(el, {
            x: opts.x,
            y: opts.y,
            w: 1,
            h: 1,
            id: opts.id,
          });
      });
    } else if (this.item.children.length) {
      this.item.children.forEach((cid) => {
        const child = Store.data.items[cid];
        if (!child) return;
        const el = createCard(child);
        this.subgrid.addWidget(el, { w: 1, h: 1, autoPosition: true });
      });
    }
  }

  reset() {
    this.item.children = [];
    this.item.layout = [];
    this.subgrid.removeAll();
    Store.patch(this.id, { children: [], layout: [] });
    this.setCollapsed(false);
    this.adjustHeight();
  }
}

export function create(data) {
  const c = new Container(data);
  return {
    el: c.wrapper,
    adjust: () => c.adjustHeight(),
  };
}
