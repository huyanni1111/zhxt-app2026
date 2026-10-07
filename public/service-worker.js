// 智慧学堂 PWA Service Worker
const CACHE_NAME = 'zhxt-cache-v1';
const OFFLINE_URL = '智慧学堂.html';

// 需要缓存的核心资源
const CORE_ASSETS = [
  './',
  './智慧学堂.html',
  './manifest.json',
  './icons/icon.svg'
];

// 安装阶段 - 缓存核心资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] 缓存核心资源');
        return cache.addAll(CORE_ASSETS).catch(err => {
          console.warn('[ServiceWorker] 部分资源缓存失败:', err);
          // 至少缓存主页面
          return cache.add(OFFLINE_URL);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// 激活阶段 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[ServiceWorker] 删除旧缓存:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  // 只缓存 GET 请求
  if (event.request.method !== 'GET') return;

  const request = event.request;
  const url = new URL(request.url);

  // 跳过非 http(s) 请求（如 chrome-extension 等）
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // 如果缓存中有，直接返回
        if (cachedResponse) {
          // 后台更新缓存（保证下次是新内容）
          fetch(request).then((response) => {
            if (response && response.status === 200 && response.type === 'basic') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
          }).catch(() => {
            // 网络失败也没关系，用缓存就行
          });
          return cachedResponse;
        }

        // 缓存中没有，走网络
        return fetch(request).then((response) => {
          // 只缓存同源的成功响应
          if (response && response.status === 200 && url.origin === self.location.origin) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // 网络失败，返回离线页面
          if (request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('离线状态', { status: 503 });
        });
      })
  );
});

// 接收来自页面的消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
