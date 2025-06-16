export function registerDriveSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(sw => sw.sync.register('sync-drive'))
      .catch(err => console.error('sync registration failed', err));
  }
}
