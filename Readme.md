# mediamtx Relay on Render

## What this gives you
- **RTMP ingest** on port `1935` — people push streams here (e.g. from OBS)
- **HLS output** on Render's public HTTPS port — your phone app pulls from here

## Deploy steps

1. Push this folder (`Dockerfile` + `mediamtx.yml`) to a GitHub repo.
2. On Render: New → Web Service → connect the repo → Environment: **Docker**.
3. Render auto-detects the `Dockerfile`. Set instance type (free tier works for testing,
   but free instances spin down when idle — fine for testing, not for 24/7 streams).
4. Deploy. Render assigns a public URL like `https://your-app.onrender.com`.

## ⚠️ Important limitation: RTMP port

Render's web services expose **only the HTTP(S) port** (`$PORT`) publicly.
Port `1935` (RTMP) will **NOT** be reachable from outside on a standard Render
web service — only the HLS/HTTP traffic will work externally.

### Options to get RTMP ingest working:

**Option A (recommended): Use a Render "Private Service" + a TCP proxy is not
supported either — Render simply doesn't do arbitrary TCP ports on most plans.**

**Option B: Switch ingest to WHIP (WebRTC over HTTP) or SRT-over-HTTP** —
not trivial, requires OBS WebRTC support (OBS 30+ has WHIP output built in!).
mediamtx supports WHIP natively over HTTP(S), so this works on Render without
any extra TCP ports.

- In `mediamtx.yml`, enable:
  ```yaml
  webrtc: yes
  webrtcAddress: :8889
  ```
  (Render will only expose this if it's the same port as `$PORT`, so route
  WHIP over the same HTTP port — mediamtx supports this via `webrtcAddress: :$PORT`
  doesn't directly work; you'd run WHIP and HLS on the same port using mediamtx's
  built-in HTTP multiplexing — check mediamtx docs for `:8889` vs `$PORT` setup.)

- In OBS 30+: Settings → Stream → Service: WHIP, Server:
  `https://your-app.onrender.com/live/whip`

**Option C (simplest, most reliable): Use a cheap VPS instead of Render**
(e.g. a $4-5/mo DigitalOcean/Vultr/Hetzner box). Full TCP control, run
mediamtx directly with both RTMP (1935) and HLS (8888) open. No workarounds
needed — your current Dockerfile/config work as-is with `docker run -p 1935:1935 -p 8888:8888`.

## If you go with Option C (VPS)
```bash
docker build -t mediamtx-relay .
docker run -d -p 1935:1935 -p 8888:8888 mediamtx-relay
```
Then in your Android app:
```kotlin
binding.etUrl.setText("http://<vps-ip>:8888/live/index.m3u8")
```
And streamers push to: `rtmp://<vps-ip>:1935/live`

This is the path of least resistance — Render's port restrictions make RTMP
ingest awkward without WHIP/WebRTC.
