# FastNotes

A simple note-taking demo powered by Vite.

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9

## Installation

```bash
npm install
```

## Development

Start a local server with live reloading:

```bash
npm run dev
```

## Build

Create a production build in the `dist` folder:

```bash
npm run build
```

## Enabling the service worker

The service worker located at `src/js/service-worker.js` enables offline support.
Register it from your application entry or add the snippet below to `index.html`:

```html
<script>
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/src/js/service-worker.js");
}
</script>
```

## Loading GridStack

GridStack is installed via npm and imported as an ES module from `app.js`.

### Passo de teste 4.2

1. Execute `npm run dev` e abra `http://localhost:5173`.
2. Clique no botão **+** para adicionar um novo card.
3. Edite o título e o texto. Altere a cor e teste o bloqueio/copiar.
4. Recarregue a página e confirme que o conteúdo persiste.

### Passo de teste 4.9

1. Clique em **Login** e autorize o acesso ao Google Drive.
2. Edite ou crie cards e aguarde alguns segundos.
3. Atualize a página e verifique se o botão exibe **Logout**.
4. Os dados devem ter sido sincronizados com o arquivo `fastnotes-backup.json` na pasta AppData do Drive.
