// 青孤项目 — Service Worker
// 提供离线缓存支持，让 PWA 可以离线访问

const CACHE_NAME = 'qinggu-project-v1';

// 需要预缓存的静态资源
const PRECACHE_URLS = [
  './',
  './index.html',
];

// 安装：预缓存核心文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('SW: 预缓存中...');
      return cache.addAll(PRECACHE_URLS);
    })
  );
  // 立即激活，不等待旧 SW 关闭
  self.skipWaiting();
});

// 激活：清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  // 立即控制所有页面
  self.clients.claim();
});

// 请求：缓存优先策略（静态资源），网络优先（API/数据）
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // 跳过非 GET 请求
  if (request.method !== 'GET') return;

  // 跳过 chrome-extension 等非 http 请求
  if (!request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      // 有缓存先用缓存，同时后台更新
      const fetchPromise = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // 网络失败时返回缓存
          return cached || new Response('离线模式', { status: 503 });
        });

      return cached || fetchPromise;
    })
  );
});
