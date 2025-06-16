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

Add GridStack from its CDN build:

```html
<script src="https://cdn.jsdelivr.net/npm/gridstack@9.3.0/dist/gridstack-all.js"></script>
```

`app.js` accesses `window.GridStack` directly—this build exposes a global variable only, so there is no ES module to import.
