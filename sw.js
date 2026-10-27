const VERSION='pnd-shell-0.2.2';
const SHELL=['./','./index.html','./styles.css','./theme.css','./illustrated.css','./src/art.mjs','./src/cast.mjs','./assets/possibilities.png','./src/app.mjs','./src/data.mjs','./src/engine.mjs','./src/storage.mjs','./src/tasks.mjs','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/player-aid-1.png','./assets/player-aid-2.png'];
const urls=new Set(SHELL.map(p=>new URL(p,self.registration.scope).href));
self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('pnd-shell-')&&k!==VERSION).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('fetch',event=>{
  // TickTick responses, the local proxy, tokens, and exports never enter this cache.
  if(event.request.method!=='GET'||!urls.has(event.request.url))return;
  event.respondWith(caches.open(VERSION).then(async cache=>(await cache.match(event.request))||fetch(event.request)));
});
