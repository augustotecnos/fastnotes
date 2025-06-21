import { GridStack } from "gridstack";
import * as Store from "../store.js";
import { create as createCard } from "./card.js";
import { t } from "../i18n.js";

export function create(data = {}) {
  const item = {
    type: "folder",
    title: data.title || "Folder",
    desc: data.desc || "",
    password: data.password || "",
    children: data.children || [],
    layout: data.layout || [],
    id: data.id,
  };
  const id = Store.upsert(item);
  const wrapper = document.createElement("div");
  wrapper.setAttribute("gs-id", id);
  wrapper.innerHTML = `
    <div class="grid-stack-item-content folder-card" tabindex="0" role="listitem" aria-label="Folder">
      <div class="folder-icon">\ud83d\udcc1<span class="lock-icon">\ud83d\udd12</span></div>
      <h6 class="folder-name"></h6>
    </div>
  `;
  const content = wrapper.firstElementChild;
  const nameEl = content.querySelector(".folder-name");
  const lockIcon = content.querySelector(".lock-icon");
  nameEl.textContent = item.title;
  if (item.password) lockIcon.style.display = "inline";

  content.addEventListener("click", openFolder);

  async function openFolder() {
    if (
      document.querySelector(".folder-overlay") ||
      document.querySelector(".password-modal")
    )
      return;
    if (item.password) {
      const ok = await requestPassword();
      if (!ok) return;
    }
    showOverlay();
  }

  function requestPassword() {
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className = "password-modal";
      modal.innerHTML = `
        <div class="password-box">
          <input class="password-input" type="password" inputmode="numeric" pattern="\\d{1,4}" maxlength="4" />
          <button class="password-submit">OK</button>
        </div>`;
      document.body.appendChild(modal);
      const input = modal.querySelector("input");
      const btn = modal.querySelector("button");
      input.focus();
      function close(res) {
        modal.remove();
        resolve(res);
      }
      btn.addEventListener("click", () => close(input.value === item.password));
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") btn.click();
        else if (e.key === "Escape") close(false);
      });
    }).then((ok) => {
      if (!ok) alert("Wrong password");
      return ok;
    });
  }

  function showOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "folder-overlay";
    overlay.innerHTML = `
      <div class="folder-header">
        <button class="folder-back" aria-label="Back">\u2190</button>
        <h6 class="folder-title" contenteditable="true"></h6>
        <button class="folder-pass" aria-label="Password">${item.password ? "🔒" : "🔓"}</button>
        <button class="folder-add" aria-label="${t("addCard")}">➕</button>
        <textarea class="folder-desc" rows="2"></textarea>
      </div>
      <div class="grid-stack folder-grid"></div>
    `;
    document.body.appendChild(overlay);
    const titleEl = overlay.querySelector(".folder-title");
    const descEl = overlay.querySelector(".folder-desc");
    const addBtn = overlay.querySelector(".folder-add");
    const passBtn = overlay.querySelector(".folder-pass");
    const gridEl = overlay.querySelector(".folder-grid");

    passBtn.addEventListener("click", () => {
      const value = prompt("Enter 4 digit password (blank to remove):", "");
      if (value === null) return;
      if (value === "") {
        item.password = "";
      } else if (/^\d{1,4}$/.test(value)) {
        item.password = value;
      } else {
        alert("Invalid password");
        return;
      }
      passBtn.textContent = item.password ? "🔒" : "🔓";
      lockIcon.style.display = item.password ? "inline" : "none";
      Store.patch(id, { password: item.password });
    });
    titleEl.textContent = item.title;
    descEl.value = item.desc;
    titleEl.addEventListener("input", () => {
      item.title = titleEl.textContent;
      nameEl.textContent = item.title;
      Store.patch(id, { title: item.title });
    });
    descEl.addEventListener("input", () => {
      item.desc = descEl.value;
      Store.patch(id, { desc: item.desc });
    });
    const childGrid = GridStack.init(
      {
        margin: 5,
        column: 12,
        float: false,
        resizable: { handles: "e, se, s, w" },
        acceptWidgets: true,
        dragOut: true,
      },
      gridEl,
    );
    if (!childGrid) return;

    function save() {
      item.layout = childGrid.save();
      item.children = item.layout.map((c) => c.id);
      Store.patch(id, {
        layout: item.layout,
        children: item.children,
        title: item.title,
        desc: item.desc,
        password: item.password,
      });
    }

    if (item.layout && item.layout.length) {
      item.layout.forEach((opts) => {
        const childItem = Store.data.items[opts.id];
        if (!childItem) return;
        let el;
        if (childItem.type === "card") {
          el = createCard(childItem);
        }
        if (el) childGrid.addWidget(el, opts);
      });
    }

    childGrid.on("change", save);

    addBtn.addEventListener("click", () => {
      const el = createCard({ parent: id });
      childGrid.addWidget(el, { w: 3, h: 2, autoPosition: true });
      save();
    });

    function close() {
      document.removeEventListener("keydown", onKey);
      save();
      childGrid.destroy();
      overlay.remove();
    }

    function onKey(e) {
      if (e.key === "Escape") close();
    }

    overlay.querySelector(".folder-back").addEventListener("click", close);
    document.addEventListener("keydown", onKey);
  }

  return wrapper;
}
