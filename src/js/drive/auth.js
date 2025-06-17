const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';
let token = localStorage.getItem('google_token');
let tokenClientLoaded = false;
let tokenClient;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

export async function init() {
  if (tokenClientLoaded) return;
  await loadScript('https://accounts.google.com/gsi/client');
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: 'https://www.googleapis.com/auth/drive.appdata',
    callback: () => {}
  });
  tokenClientLoaded = true;
}

export function isSignedIn() {
  return !!token;
}

export async function signIn() {
  await init();
  return new Promise((resolve, reject) => {
    tokenClient.callback = resp => {
      if (resp.error) {
        reject(resp);
        return;
      }
      token = resp.access_token;
      localStorage.setItem('google_token', token);
      resolve(token);
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

export function signOut() {
  if (token) {
    google.accounts.oauth2.revoke(token, () => {});
    token = null;
    localStorage.removeItem('google_token');
  }
}

export function getToken() {
  return token;
}
