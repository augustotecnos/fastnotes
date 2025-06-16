import * as Store from '../store.js';

export function create(data = {}) {
  const item = {
    type: 'card',
    title: data.title || 'Título',
    text: data.text || '',
    color: data.color || '#77d6ec',
    locked: data.locked || false,
    id: data.id
  };
  const id = Store.upsert(item);
  const wrapper = document.createElement('div');
  wrapper.setAttribute('gs-id', id);
  wrapper.innerHTML = `
    <div class="grid-stack-item-content card">
      <div class="card-actions">
        <button class="lock" aria-label="Lock">🔒</button>
        <button class="copy" aria-label="Copy">📄</button>
        <input class="color" type="color" value="${item.color}">
      </div>
      <h6 contenteditable="true" spellcheck="false"></h6>
      <textarea></textarea>
    </div>`;
  const content = wrapper.firstElementChild;
  const titleEl = content.querySelector('h6');
  const textEl = content.querySelector('textarea');
  const colorEl = content.querySelector('input.color');
  const lockBtn = content.querySelector('button.lock');
  titleEl.textContent = item.title;
  textEl.value = item.text;
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

  function applyColor(value) {
    content.style.background = value;
  }

  function setLock(flag) {
    wrapper.dataset.locked = flag;
    titleEl.contentEditable = !flag;
    textEl.readOnly = flag;
    lockBtn.textContent = flag ? '🔓' : '🔒';
  }

  return wrapper;
}
