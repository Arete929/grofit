/* 혜원핏 PWA 서비스워커 | 버전 올리면 화면 캐시 갱신·자동 새로고침
   [1.22.0] 캐시를 둘로 나눴다.
     · 화면(CACHE = grofit-v<버전>)  : index.html 만. 버전마다 새로 받는다(약 260KB).
     · 그림(STATIC = grofit-static-N): 탭 아이콘·운동 그림·이모티콘·테마 로고·매니페스트. 버전이 바뀌어도 그대로 쓴다.
   예전에는 버전을 올릴 때마다 그림 104개(4.8MB)를 통째로 다시 받아, 업데이트한 날마다 앱이 느리고 도중에 새로고침됐다.
   처음 이 판으로 바뀔 때도 옛 캐시에 있던 그림을 옮겨 담으므로 다시 받지 않는다.
   ★그림 파일을 «같은 이름»으로 바꿔 넣었으면 STATIC 숫자를 올릴 것 — 그래야 새 그림을 받는다.
   ★그림 한 장을 못 받아도 설치는 계속된다(예전 addAll 은 한 장만 없어도 설치가 통째로 실패했다). */
var CACHE = 'grofit-v1.26.0';
var STATIC = 'grofit-static-1';
var PAGES = ['./', './index.html'];
var ASSETS = [
  './tab-home.png', './tab-cert.png', './tab-exercise.png', './tab-fit.png', './tab-reflect.png', './tab-score.png', './tab-notice.png', './ic-cardio.png', './ic-strength.png',
  './jinho.png', './tm-1-job.jpg', './tm-2-perm.jpg', './tm-3-template.jpg', './tm-4-edit.jpg', './tm-5-done.jpg', './ex-squat.jpg', './ex-wave-1.jpg', './ex-wave-2.jpg', './ex-wave-3.jpg', './ex-wave-4.jpg', './ex-wave-warn.jpg', './ex-armwalk-1.jpg', './ex-armwalk-2.jpg', './ex-armwalk-warn1.jpg', './ex-armwalk-warn2.jpg', './ex-lunge-1.jpg', './ex-lunge-2.jpg', './ex-lunge-warn.jpg', './ex-wide-1.jpg', './ex-wide-2.jpg', './ex-wide-3.jpg', './ex-wide-warn.jpg', './ex-side-1.jpg', './ex-side-2.jpg', './ex-side-warn.jpg', './ex-push-std.jpg', './ex-push-narrow.jpg', './ex-push-elbow.jpg', './ex-squat-knee.jpg', './ex-squat-back.jpg', './ex-squat-wall.jpg', './ex-plank.jpg', './ex-legraise.jpg',
  './st-verygood.png','./st-good.png','./st-nice.png','./st-peace.png','./st-regret.png','./st-frustration.png','./st-sob.png','./st-wail.png','./st-no.png', './st-workout.png', './st-watch.png', './st-cheer.png',
  './splash-locke.jpg','./ic-flex.png','./ic-body.png',
  './ex-app-samsung.jpg','./ex-app-nrc.jpg','./ex-app-apple.jpg'];   // [1.25.0] 앱별 실제 상세 화면 예시(새 이름이라 STATIC 은 그대로)
/* 테마 6종의 manifest·아이콘·로고도 오프라인 캐시 (설치 아이콘이 테마별로 다름) */
for (var i = 1; i <= 6; i++) ASSETS.push('./manifest' + i + '.webmanifest',
  './icon' + i + '-192.png', './icon' + i + '-512.png', './icon' + i + '-180.png',
  './icon' + i + '-mask-192.png', './icon' + i + '-mask-512.png', './theme' + i + '.png');

/* 그림 한 장 — 이미 있으면 그대로, 옛 캐시에 있으면 옮겨 담고, 없을 때만 받는다 */
function keepAsset(st, u) {
  return st.match(u).then(function (hit) {
    if (hit) return;
    return caches.match(u).then(function (old) {
      return old ? st.put(u, old) : st.add(u);
    });
  }).catch(function () {});
}

self.addEventListener('install', function (e) {
  e.waitUntil(Promise.all([
    /* 화면은 HTTP 캐시를 건너뛰고 새로 받는다(깃허브 페이지는 10분 캐시라 옛 화면이 들어올 수 있다) */
    caches.open(CACHE).then(function (c) {
      return c.addAll(PAGES.map(function (u) { return new Request(u, { cache: 'reload' }); }));
    }),
    caches.open(STATIC).then(function (st) {
      return Promise.all(ASSETS.map(function (u) { return keepAsset(st, u); }));
    })
  ]).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== STATIC; }).map(function (k) { return caches.delete(k); }));
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

  // 이미지·매니페스트 등 정적 리소스: 캐시 우선(빠름), 없으면 네트워크 → 그림 캐시에 담는다
  e.respondWith(
    caches.match(e.request).then(function (r) {
      return r || fetch(e.request).then(function (res) {
        if (res && res.ok && url.origin === location.origin) {
          var clone = res.clone();
          caches.open(STATIC).then(function (c) { c.put(e.request, clone); });
        }
        return res;
      }).catch(function () { return caches.match('./index.html'); });
    })
  );
});
