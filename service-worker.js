const CACHE_NAME = "to-do-pwa-cache-v1";
const FILES_TO_CACHE = [
  "/pwa-todo-app/",
  "/pwa-todo-app/index.html",
  "/pwa-todo-app/style.css",
  "/pwa-todo-app/app.js",
  "/pwa-todo-app/manifest.json",
  "/pwa-todo-app/icons/icon-128.png",
  "/pwa-todo-app/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE)),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request)),
  );
});

