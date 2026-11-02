# server.js — Termux mode

## 1. require + mount (after the router/`handleApi` definition)

    const BACKEND = process.env.LRD_BACKEND || 'waydroid';
    if (BACKEND === 'hostandroid') {
      const host = require(require('path').join(__dirname, 'os/termux/backends/hostandroid.js'));
      // adapt to server.js's router shape: it exposes route(method, path, fn)
      // with `fn(req, res, query, params)`.
      for (const r of host.routes()) {
        if (typeof route === 'function') route(r.method, r.path, r.fn);
        else ROUTES.push({ method: r.method, path: r.path, fn: r.fn });
      }
      log('backend: hostandroid (host device) installMode=' + host.caps().installMode);
    }

If your router only supports `:param` without a params object, pass the regex
captures as the 4th arg — hostandroid already expects `(req, res, query, params)`.

## 2. bind loopback only (fail-closed)

    const HOST = process.env.LRD_BIND || '127.0.0.1';
    server.listen(PORT, HOST, () => log(`http://${HOST}:${PORT}`));

If LRD_STRICT_LOCAL=1 and HOST==='0.0.0.0', warn: you are now reachable on the LAN.

## 3. /healthz (the watchdog depends on it)

    if (pathname === '/healthz') {
      res.writeHead(200, {'content-type':'application/json'});
      return res.end(JSON.stringify({ok:true, backend:BACKEND, up:process.uptime()}));
    }

## 4. serve the PWA manifest + vendored models

    if (pathname === '/manifest.webmanifest') return serveFile(res, 'dist/manifest.webmanifest');
    if (pathname.startsWith('/models/'))         return serveFile(res, path.join(LRD_MODELS, pathname.slice(8)));

## 5. store.js: ABI + sdk source

Replace the waydroid prop reads with the backend probe:

    const host = require('./os/termux/backends/hostandroid.js');
    const ABIS = host.deviceAbis();          // ['arm64-v8a','armeabi-v7a']
    const SDK  = host.deviceSdk();           // e.g. 34
    // keep the existing buildCatalog() filter — it now filters against the real device.

And swap the install call in the store route to `host.installApk(path)`; the
sha256 verification you already wrote stays as the pre-install gate.

## 6. index.html needs the manifest link + fullscreen hint

Already done by bootstrap/10-deploy.sh. The shell reads `?kiosk=1` to hide chrome.
