/* Service Worker: يخدم موقع الطلبات فقط. غيّر رقم النسخة عند كل تحديث كبير لتنظيف الكاش القديم. */
const V = "almajd-v1";
const ASSETS = ["./", "index.html", "policies.html", "about-almagd.html", "policies.js", "logo.png", "icon.png", "manifest.webmanifest"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => Promise.allSettled(ASSETS.map(a => c.add(a)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin) return;     // الشيت والخطوط والصور الخارجية: المتصفح يتولاها
  if (/invoice|admin-|^\/_vercel\//i.test(u.pathname)) return;                      // صفحة الإدارة لا تُخزَّن أبداً
  const isPage = r.mode === "navigate" || /\.(html|js)$/i.test(u.pathname) || u.pathname.endsWith("/");
  if (isPage){                                                         // الصفحات: الشبكة أولاً ثم الكاش (التحديثات تصل فوراً)
    const key = r.mode === "navigate" ? new Request(u.origin + u.pathname) : r;   // روابط المنشورات بعلامات ?utm لا تُكرَّر في الكاش
    e.respondWith(fetch(r).then(res => { if (res.ok){ const cp = res.clone(); caches.open(V).then(c => c.put(key, cp)); } return res; })
      .catch(() => caches.match(key).then(m => m || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(r).then(m => {                            // الصور والملفات الثابتة: الكاش أولاً مع تحديث بالخلفية
    const net = fetch(r).then(res => { if (res.ok){ const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; }).catch(() => m);
    return m || net;
  }));
});
