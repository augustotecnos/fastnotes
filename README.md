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

## Build & Deploy

Create a production build with PWA assets in the `dist` folder:

```bash
npm run build
```

To preview the production build locally:
Copy the contents of `dist/` to a static host such as GitHub Pages or Netlify.
If the app is served from a subpath (for example
`https://username.github.io/fastnotes/`), add
`<base href="/fastnotes/">` inside `index.html` so asset paths resolve.

## Enabling the service worker

```bash
npm run preview
```

## PWA Support

`vite-plugin-pwa` injects the service worker and manifest automatically.
Offline support is enabled by default and registered from `app.js`.

=======

## License

# This project is licensed under the [MIT License](LICENSE).

## Loading GridStack

GridStack is installed via npm and imported as an ES module from `app.js`.

### Passo de teste 4.2

1. Execute `npm run dev` e abra `http://localhost:5173`.
2. Clique no botão **+** para adicionar um novo card.
3. Edite o título e o texto. Altere a cor e teste o bloqueio/copiar.
4. Recarregue a página e confirme que o conteúdo persiste.

### Passo de teste 4.4

1. Execute `npm run dev` e abra `http://localhost:5173`.
2. Clique no **+** e escolha **Container**.
3. Use a seta para recolher e expandir. Arraste o container pelo grid.
   A altura deve se ajustar imediatamente.
4. Recarregue a página e confirme que o container continua no lugar.

### Passo de teste 4.5

1. Clique no botão **+** e escolha o 📁 para criar uma pasta.
2. Clique na pasta para abrir a visualização em tela cheia.
3. Edite o título e a descrição da pasta.
4. Use **ESC** ou o botão de voltar para fechar o overlay.
5. Reabra a pasta e confirme que título e descrição foram salvos.

## Backup com JSON

Na interface é possível exportar as notas atuais clicando em **Export**. Um arquivo
terminado em `.fastnotes.json` será baixado contendo todos os dados.

Para restaurar, clique em **Import** e escolha um arquivo exportado
anteriormente. A página será recarregada com o conteúdo importado.

### Passo de teste 4.9

1. Clique em **Login** e autorize o acesso ao Google Drive.
2. Edite ou crie cards e aguarde alguns segundos.
3. Atualize a página e verifique se o botão exibe **Logout**.
4. Os dados devem ter sido sincronizados com o arquivo `fastnotes-backup.json` na pasta AppData do Drive.

## Switching languages

The interface defaults to the browser language and supports English (`en`) and Portuguese (`pt`).
To override the detected language, set the `lang` key in `localStorage` and reload:

```js
localStorage.setItem("lang", "en");
location.reload();
```

You can also change it at runtime from the console:

```js
i18n.setLanguage("pt");
```
