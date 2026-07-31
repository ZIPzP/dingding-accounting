// 青孤项目 — Service Worker
// 提供离线缓存支持，让 PWA 可以离线访问

const CACHE_NAME = 'qinggu-project-v2';

// 需要预缓存的静态资源
const PRECACHE_URLS = [
  './',
  './index.html',
];

// 安装：预缓存核心文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW v2: 预缓存中...');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// 激活：清理旧缓存，立即控制页面
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 请求策略：HTML 走网络优先（确保更新即时生效），其他静态资源走缓存优先
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  const isHtml = request.mode === 'navigate' || request.destination === 'document';

  if (isHtml) {
    // HTML：网络优先，失败才用缓存
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
  } else {
    // 静态资源：缓存优先，后台更新
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached || new Response('离线模式', { status: 503 }));
        return cached || fetchPromise;
      })
    );
  }
});
