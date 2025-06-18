export const PT = {
  add: "Adicionar",
  lock: "Bloquear",
  unlock: "Desbloquear",
  copy: "Copiar",
  titleDefault: "Título",
  containerDefault: "Container",
  toggle: "Alternar",
  addCard: "Adicionar card",
  delete: "Excluir",
  moveOut: "Enviar para tela principal",
  moveIn: "Mover para container",
  selectContainer: "Escolha o container (id)",
};

export const EN = {
  add: "Add",
  lock: "Lock",
  unlock: "Unlock",
  copy: "Copy",
  titleDefault: "Title",
  containerDefault: "Container",
  toggle: "Toggle",
  addCard: "Add card",
  delete: "Delete",
  moveOut: "Move out",
  moveIn: "Move into container",
  selectContainer: "Choose container (id)",
};

const DICTS = { pt: PT, en: EN };
let currentLang = "en";

function detect() {
  const saved = localStorage.getItem("lang");
  if (saved && DICTS[saved]) {
    currentLang = saved;
  } else if (navigator.language && navigator.language.startsWith("pt")) {
    currentLang = "pt";
  }
  document.documentElement.lang = currentLang;
}

detect();

export function setLanguage(lang) {
  if (DICTS[lang]) {
    currentLang = lang;
    localStorage.setItem("lang", lang);
    document.documentElement.lang = currentLang;
  }
}

export function getLanguage() {
  return currentLang;
}

export function t(key) {
  return DICTS[currentLang][key] || key;
}

if (typeof window !== "undefined") {
  window.i18n = { t, setLanguage, getLanguage };
}
