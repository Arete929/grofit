/* 그로핏 PWA 서비스워커 | 버전 올리면 캐시 갱신·자동 새로고침 */
var CACHE = 'grofit-v0.79.0';
var ASSETS = ['./', './index.html',
  './tab-home.png', './tab-cert.png', './tab-exercise.png', './tab-fit.png', './tab-reflect.png', './tab-score.png', './tab-notice.png', './ic-cardio.png', './ic-strength.png',
  './jinho.png', './ex-squat.png', './ex-squat-knee.png', './ex-squat-back.png', './ex-squat-wall.png', './ex-plank.png', './ex-legraise.png',
  './st-verygood.png','./st-good.png','./st-nice.png','./st-peace.png','./st-regret.png','./st-frustration.png',
  './splash-locke.jpg','./ic-flex.png','./ic-body.png'];
/* 테마 6종의 manifest·아이콘·로고도 오프라인 캐시 (설치 아이콘이 테마별로 다름) */
for (var i = 1; i <= 6; i++) ASSETS.push('./manifest' + i + '.webmanifest',
  './icon' + i + '-192.png', './icon' + i + '-512.png', './icon' + i + '-180.png',
  './icon' + i + '-mask-192.png', './icon' + i + '-mask-512.png', './theme' + i + '.png');

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  // API(GAS) 호출은 절대 캐시하지 않음 — 항상 네트워크
  if (url.hostname.indexOf('script.google') >= 0 || url.hostname.indexOf('googleusercontent') >= 0) return;
  if (e.request.method !== 'GET') return;

  // ★ HTML(앱 화면)은 '네트워크 먼저' — 새 버전을 즉시 받는다.
  //   (캐시 우선으로 두면 코드를 고쳐도 옛 화면이 계속 떠서 빈 화면 같은 문제가 생김)
  var isHTML = e.request.mode === 'navigate'
    || (e.request.headers.get('accept') || '').indexOf('text/html') >= 0
    || /\/$|\.html$/.test(url.pathname);
  if (isHTML && url.origin === location.origin) {
    e.respondWith(
      fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        }
        return res;
      }).catch(function () {                       // 오프라인이면 캐시로
        return caches.match(e.request).then(function (r) { return r || caches.match('./index.html'); });
      })
    );
    return;
  }

  // 이미지·매니페스트 등 정적 리소스: 캐시 우선(빠름), 없으면 네트워크
  e.respondWith(
    caches.match(e.request).then(function (r) {
      return r || fetch(e.request).then(function (res) {
        if (res && res.ok && url.origin === location.origin) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        }
        return res;
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
