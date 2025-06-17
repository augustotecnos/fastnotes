
export function registerDriveSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready
      .then(sw => sw.sync.register('sync-drive'))
      .catch(err => console.error('sync registration failed', err));

import { getToken } from './auth.js';

const FILE_NAME = 'fastnotes-backup.json';
let fileId = null;

async function request(url, options = {}) {
  const token = getToken();
  if (!token) throw new Error('not authorized');
  options.headers = Object.assign({}, options.headers, {
    Authorization: `Bearer ${token}`
  });
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(res.statusText);
  return res;
}

async function findFile() {
  if (fileId) return fileId;
  const q = encodeURIComponent(`name='${FILE_NAME}' and 'appDataFolder' in parents and trashed=false`);
  const res = await request(`https://www.googleapis.com/drive/v3/files?q=${q}&spaces=appDataFolder&fields=files(id)`);
  const data = await res.json();
  fileId = data.files && data.files.length ? data.files[0].id : null;
  return fileId;
}

export async function download() {
  const id = await findFile();
  if (!id) return null;
  const res = await request(`https://www.googleapis.com/drive/v3/files/${id}?alt=media`);
  return await res.json();
}

export async function upload(json) {
  const body = JSON.stringify(json);
  const id = await findFile();
  if (id) {
    await request(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body
    });
  } else {
    const metadata = { name: FILE_NAME, parents: ['appDataFolder'] };
    const boundary = '-------314159265358979323846';
    const multipart =
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify(metadata) +
      `\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n` +
      body +
      `\r\n--${boundary}--`;
    await request('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body: multipart
    });

  }
}
