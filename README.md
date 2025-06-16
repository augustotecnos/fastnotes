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
