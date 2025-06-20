import * as Store from "../store.js";
import { t } from "../i18n.js";
import { TITLE_MAX_LENGTH, TEXT_MAX_LENGTH } from "../constants.js";

export function create(data = {}) {
  const item = {
    type: "card",
    title: data.title || t("titleDefault"),
    text: data.text || "",
    color: data.color || "#77d6ec",
    locked: data.locked || false,
    id: data.id,
    parent: data.parent || "root",
  };
  const id = Store.upsert(item);
  const wrapper = document.createElement("div");
  wrapper.setAttribute("gs-id", id);
  wrapper.dataset.parent = item.parent;
  wrapper.dataset.color = item.color;
  wrapper.innerHTML = `
    <div class="grid-stack-item-content card" tabindex="0" role="listitem" aria-label="Note card">
      <div class="card-actions">
        <button class="lock" aria-label="Lock">🔒</button>
        <button class="copy" aria-label="Copy">📄</button>
        <button class="delete" aria-label="Delete">🗑️</button>
        <input class="color" type="color" aria-label="Color" value="${item.color}">
      </div>
      <h6 contenteditable="true" spellcheck="false"></h6>
      <textarea></textarea>
      <div class="resize-handle" aria-hidden="true"></div>
    </div>`;
  const content = wrapper.firstElementChild;
  const titleEl = content.querySelector("h6");
  const textEl = content.querySelector("textarea");
  const colorEl = content.querySelector("input.color");
  const lockBtn = content.querySelector("button.lock");
  const copyBtn = content.querySelector("button.copy");
  const delBtn = content.querySelector("button.delete");
  titleEl.textContent = item.title;
  textEl.value = item.text;
  colorEl.value = item.color;
  lockBtn.setAttribute("aria-label", t("lock"));
  copyBtn.setAttribute("aria-label", t("copy"));
  applyColor(item.color);
  setLock(item.locked);

  titleEl.addEventListener("input", () => {
    const text = titleEl.textContent.slice(0, TITLE_MAX_LENGTH);
    if (text !== titleEl.textContent) titleEl.textContent = text;
    Store.patch(id, { title: text });
  });
  textEl.setAttribute("maxlength", TEXT_MAX_LENGTH);
  textEl.addEventListener("input", () => {
    if (textEl.value.length > TEXT_MAX_LENGTH)
      textEl.value = textEl.value.slice(0, TEXT_MAX_LENGTH);
    Store.patch(id, { text: textEl.value });
  });
  function onColorChange() {
    applyColor(colorEl.value);
    Store.patch(id, { color: colorEl.value });
  }
  colorEl.addEventListener("input", onColorChange);
  colorEl.addEventListener("change", onColorChange);
  lockBtn.addEventListener("click", () => {
    const locked = wrapper.dataset.locked === "true";
    setLock(!locked);
    Store.patch(id, { locked: wrapper.dataset.locked === "true" });
  });
  content.querySelector("button.copy").addEventListener("click", () => {
    navigator.clipboard.writeText(textEl.value);
  });
  delBtn.addEventListener("click", () => {
    const g = wrapper.closest(".grid-stack")?.gridstack;
    if (g) g.removeWidget(wrapper);
    else wrapper.remove();
    wrapper.dispatchEvent(new CustomEvent("removed", { bubbles: true }));
    Store.trash(id);
  });

  function hexToRgb(hex) {
    hex = hex.replace("#", "");
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
    };
  }

  function applyColor(value) {
    wrapper.dataset.color = value;
    const { r, g, b } = hexToRgb(value);
    content.style.background = `rgba(${r}, ${g}, ${b}, 0.34)`;
    content.style.border = `1px solid rgba(${r}, ${g}, ${b}, 0.48)`;
    content.style.borderRadius = "16px";
    content.style.boxShadow = "0 4px 30px rgba(0, 0, 0, 0.1)";
    content.style.backdropFilter = "blur(6.7px)";
    content.style.webkitBackdropFilter = "blur(6.7px)";
  }

  function setLock(flag) {
    wrapper.dataset.locked = flag;
    titleEl.contentEditable = !flag;
    textEl.readOnly = flag;
    textEl.style.opacity = flag ? "0.6" : "";
    lockBtn.textContent = flag ? "🔓" : "🔒";
    lockBtn.setAttribute("aria-label", flag ? t("unlock") : t("lock"));
  }

  return wrapper;
}
