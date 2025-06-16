🗺️ “FastNotes” – Road Map técnico completo
Objetivo: entregar uma SPA PWA onde o usuário pode criar cards, containers (collapses) e pastas, organizá-los em grid drag-and-drop, editar título/nota/cor, bloquear cópia, exportar/importar, trabalhar offline e, quando logado, sincronizar tudo com Google Drive (backup JSON).

As instruções abaixo formam um mapa sequencial para que o Codex gere cada trecho de código.
Sempre que um passo depender do anterior, inclua os imports, ajuste o package.json e atualize o README.

0 · Revisão rápida do que já existe
Pasta/arquivoSituaçãoAção imediata
index.html Já carrega Vite + GridStack via CDN.OK. Mantenha-o na raiz; Vite procura ali mesmo.
src/js/app.js Grid básico + salvar layout em localStorage.Refatorar para módulos (ver Passo 2).
main.cssEstilo mínimo.Converter para SCSS ou CSS Modules depois do protótipo.
service-worker.jsCache somente de index.html.Estender no Passo 8.

1 · Base do projeto (já concluído, só confirmar)
npm create vite@latest fastnotes -- --template vanilla

Instalar dependências de UI e tipagem:

```bash
npm i gridstack@^9.3.0 collapsejs nanoid
npm i -D eslint prettier vite-plugin-pwa
```
Estrutura final:

```arduino
src/
  js/
    app.js          // entry
    store.js        // camada de persistência local + Drive
    ui/
      card.js
      container.js
      folder.js
    drive/
      auth.js
      sync.js
  css/
    main.css
public/             // ícones, manifest, ...
index.html
vite.config.js
```

2 · Arquitetura de código
CamadaResponsabilidadeNotas
UI ComponentsRenderizar GridStack items (Card/Container/Folder). Cada componente exporta create(data) que devolve HTMLElement já contendo eventos.Usar nanoid() para id.
StoreCRUD de entidades, ordem de grid.save(), flags (cor, lock, …). Persiste em localStorage e (quando logado) em Google Drive (arquivo fastnotes-backup.json).Expor API assíncrona: load(), save(), sync().
Driveauth.js → fluxo OAuth2 “popup” + gapi. sync.js → localizar/gerar arquivo, fazer diff simples (timestamp) e chamar Store.Escopo: https://www.googleapis.com/auth/drive.appdata.
Service WorkerCache estático + fallback networkFirst para backup Drive.Usar vite-plugin-pwa para injeção automática.

3 · Modelo de dados (uma única árvore JSON)
```json
{
  "updated": 1714928820000,
  "items": {
    "card_abc": { "type": "card", "title": "…", "text": "…", "color": "#77d6ec", "locked": false },
    "cont_xyz": { "type": "container", "title": "Sprint", "children": ["card_abc", "card_def"] },
    "fold_rst": { "type": "folder", "title": "Projeto X", "desc": "…", "children": ["cont_xyz"] }
  },
  "layout": [ /* grid.save(true) result */ ]
}
```
Regra: qualquer movimento (grid ou arrastar dentro de container/folder) dispara Store.save().

4 · Funcionalidades passo-a-passo
#EntregaDetalhes de implementação
4.1Refactor app.js em módulo ES. Importar GridStack, criar grid na #grid, mover funções de CRUD para store.js.Eliminar referências globais (window).
4.2Componente Card- Linha de título (<h6 contenteditable>).
- <textarea> redimensionável vertical.
- Botões: lock, copy, color.
- Evento input → Store.save(id, patch).
4.3Action-FAB com menu radial (+ → Card, Container, Folder).Pode usar CSS + JS puro; sem dependência extra.
4.4Container (Collapse)- GridStack “filho” (staticGrid:true para cartões internos).
- Toggle seta para retrair/expandir.
- Restrição: largura mínima = 1 cartão.
- Ao expandir recoloca altura via grid.resize.
4.5Folder- Ícone quadrado no grid.
- Clicar → overlay fullscreen (div flex) com outro GridStack.
- Esc ou “voltar” fecha sem sair da página.
- Scroll interno estilizado com CSS.
4.6Drag-and-Drop entre gruposImplementar grid.on('dropped', …) + dragstart manual para detectar alvo (container/folder). Atualizar items[parent].children.
4.7Import / Export JSONJá existe. Expandir para respeitar novo modelo (arquivos .fastnotes.json).
4.8Service Worker + PWA- vite-plugin-pwa strategy “injectManifest”.
- Pré-cache estático + fallback.
- Background sync: em sync.js, usar navigator.serviceWorker.ready.then(sw => sw.sync.register('sync-drive')).
4.9Autenticação Google & Backup- Botão “Login / Logout”.
- Após login: Store.sync() envia JSON a Drive (AppData).
- No load: se usuário logado, baixa arquivo antes de Store.load().
4.10Internacionalização mínimaCriar objeto i18n.js com strings PT/EN. Decidir idioma 1× no start.
4.11A11y & Responsividade- Navegação teclado (setas & Enter para cards).
- prefers-color-scheme dark mode simples.
- Breakpoint tablets: grid column:6.
4.12Deploy- npm run build → dist/.
- GitHub Pages ou Netlify. <base href="/fastnotes/"> se necessário.

5 · Guia de implementação para o Codex
Comece sempre pelo Store: sem dados nada funciona.

Construa componentes isolados (card.js, etc.) em “playground” HTML antes de integrar.

Para cada funcionalidade:

Escreva testes manuais no README (“Passo de teste”).

Atualize documentação e exemplos de commit.

Mantenha commits pequenos seguindo a tabela 4.x—um commit por linha.

Após 4.8, rode Lighthouse offline para garantir PWA “100/100”.

Quando mexer no modelo JSON, escreva migration no store.js (version field).

6 · Pontos de atenção
Google API quota – use AppData folder, tamanho máximo 5 MB.

GridStack nested – containers/folders precisam de nested grids. Use opção subGrid=true (v9+).

IndexedDB – se o JSON crescer, trocar localStorage por idb-keyval.

Security – sanitize contenteditable HTML (textContent only).

Performance – debounce save() (200 ms).

7 · Exemplo: skeleton de store.js
```js
// src/js/store.js
import { nanoid } from 'nanoid';

const KEY = 'fastnotes-json';
export let data = { version:1, updated:Date.now(), items:{}, layout:[] };

export async function load() {
  const raw = localStorage.getItem(KEY);
  if (raw) data = JSON.parse(raw);
  return data;
}
export function save() {
  data.updated = Date.now();
  localStorage.setItem(KEY, JSON.stringify(data));
}
export function upsert(item) {
  if (!item.id) item.id = nanoid();
  data.items[item.id] = item;
  save();
  return item.id;
}
export function remove(id) {
  delete data.items[id];
  save();
}
```
✅ Próximos passos
Copiar esta mensagem para o seu arquivo ROADMAP.md no repositório.

Peça ao Codex para executar o item 4.1, confirmando testes do README.

Siga a sequência—um item por vez, commitando e validando.

Boa construção! Se precisar de detalhamento de qualquer passo, é só chamar.
