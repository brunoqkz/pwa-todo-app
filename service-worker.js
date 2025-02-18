const CACHE_NAME = "to-do-pwa-cache-v1";
const FILES_TO_CACHE = [
  "/pwa-todo-app/",
  "/pwa-todo-app/assets/css/style.css",
  "/pwa-todo-app/assets/html/index.html",
  "/pwa-todo-app/assets/html/tasks.html",
  "/pwa-todo-app/assets/icons/favicon.ico",
  "/pwa-todo-app/assets/icons/icon-128.png",
  "/pwa-todo-app/assets/icons/icon-512.png",
  "/pwa-todo-app/assets/js/firebase.js",
  "/pwa-todo-app/assets/js/signIn.js",
  "/pwa-todo-app/assets/js/tasks.js",
  "/pwa-todo-app/manifest.json",
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
