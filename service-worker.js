// src/service-worker.js
// This minimal service worker will make CRA happy

// This line is REQUIRED - it provides the manifest that CRA looks for
self.__WB_MANIFEST = [];

// Install
self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
});

// Activate  
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
});

// Fetch
self.addEventListener('fetch', (event) => {
  // Simple pass-through for now
  event.respondWith(fetch(event.request));
});