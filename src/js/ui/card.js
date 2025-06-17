import * as Store from '../store.js';
import { t } from '../i18n.js';

export function create(data = {}) {
  const item = {
    type: 'card',
    title: data.title || t('titleDefault'),
    text: data.text || '',
    color: data.color || '#77d6ec',
    locked: data.locked || false,
    id: data.id,
    parent: data.parent || 'root'
  };
  const id = Store.upsert(item);
  const wrapper = document.createElement('div');
  wrapper.setAttribute('gs-id', id);
  wrapper.dataset.parent = item.parent;
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
    </div>`;
  const content = wrapper.firstElementChild;
  const titleEl = content.querySelector('h6');
  const textEl = content.querySelector('textarea');
  const colorEl = content.querySelector('input.color');
  const lockBtn = content.querySelector('button.lock');
  const copyBtn = content.querySelector('button.copy');
  const delBtn = content.querySelector('button.delete');
  titleEl.textContent = item.title;
  textEl.value = item.text;
  lockBtn.setAttribute('aria-label', t('lock'));
  copyBtn.setAttribute('aria-label', t('copy'));
  applyColor(item.color);
  setLock(item.locked);

  titleEl.addEventListener('input', () => {
    Store.patch(id, { title: titleEl.textContent });
  });
  textEl.addEventListener('input', () => {
    Store.patch(id, { text: textEl.value });
  });
  colorEl.addEventListener('input', () => {
    applyColor(colorEl.value);
    Store.patch(id, { color: colorEl.value });
  });
  lockBtn.addEventListener('click', () => {
    const locked = wrapper.dataset.locked === 'true';
    setLock(!locked);
    Store.patch(id, { locked: wrapper.dataset.locked === 'true' });
  });
  content.querySelector('button.copy').addEventListener('click', () => {
    navigator.clipboard.writeText(textEl.value);
  });
  delBtn.addEventListener('click', () => {
    const g = wrapper.closest('.grid-stack')?.gridstack;
    if (g) g.removeWidget(wrapper);
    Store.remove(id);
  });

  function applyColor(value) {
    content.style.background = value;
  }

  function setLock(flag) {
    wrapper.dataset.locked = flag;
    titleEl.contentEditable = !flag;
    textEl.readOnly = flag;
    lockBtn.textContent = flag ? '🔓' : '🔒';
    lockBtn.setAttribute('aria-label', flag ? t('unlock') : t('lock'));
  }

  return wrapper;
}
