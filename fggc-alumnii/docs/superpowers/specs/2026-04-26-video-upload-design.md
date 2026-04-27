# Video Upload for PRO Admins — Design Spec
Date: 2026-04-26

## Overview

Allow PRO admins to upload videos (up to 200MB) in all three upload sections: gallery, news/stories, and events. Videos in the gallery display with a play-button overlay and open in the lightbox. Videos in news posts play inline with native controls. This also fixes an existing bug where the gallery frontend uses `img.dataUrl` instead of the `img.url` the API actually returns.

---

## Approach

Unified media field — the existing `image` input in news and events forms becomes an "image or video" field. Files are stored in the same `image` DB column. The backend detects the type by file extension at read time and responds appropriately. No schema changes required.

---

## Backend Changes

### `gallery.js`
- Add `limits: { fileSize: 200 * 1024 * 1024 }` to the multer config.
- Add a `fileFilter` that allows images (`jpg`, `jpeg`, `png`, `gif`, `webp`) and videos (`mp4`, `webm`, `mov`, `m4v`, `ogg`). Reject all other types with a descriptive error message.
- The GET handler already detects video by extension and sets `type: 'video'` — no change needed there.

### `news.js`
- Extend the `fileFilter` for the `image` field to also allow video extensions (`mp4`, `webm`, `mov`, `m4v`, `ogg`).
- Add `limits: { fileSize: 200 * 1024 * 1024 }` to the multer config.
- In the GET handler: if `item.image` has a video extension, return `videoUrl: /uploads/<filename>` instead of base64-encoding the file. Images continue to return `imageData` (base64) as before. Base64-encoding a 200MB video would be catastrophic.

### `events.js`
- Add a `fileFilter` (currently has none) allowing images and video extensions.
- Add `limits: { fileSize: 200 * 1024 * 1024 }`.

---

## Frontend — Admin Forms (`admin-dashboard.html`)

| Form | Change |
|------|--------|
| Gallery | Already has `accept="image/*,video/*"` — no change |
| News | Label → "Image or Video (Optional)", add `video/*` to `accept` |
| Events | Label → "Image or Video (Optional)", add `video/*` to `accept` |

The `handleUpload` function already passes FormData as-is, so no JS logic changes are needed.

---

## Frontend — Gallery Display (`gallery.html`)

### Bug fix
Replace all `img.dataUrl` references with `img.url`. The API has always returned `url` (not `dataUrl`) — the gallery has been broken for some time.

### Grid rendering
- **Images:** `<img src="${item.url}" alt="${item.caption}">` — same as before.
- **Videos:** `<video src="${item.url}" muted preload="metadata">` wrapped in a container that overlays a circular play button (white circle, navy triangle) and a small "VIDEO" badge in the corner.

### Lightbox
Add a `<video id="lightbox-video" controls>` element alongside the existing `<img id="lightbox-img">`.

- `openLightbox(item)` — if `item.type === 'video'`: hide `<img>`, show and `src`-set `<video>`. If image: show `<img>`, hide `<video>`.
- `closeLightbox()` — pause and clear the video src so it stops loading/playing in the background.

---

## Frontend — Events Display

No changes needed. The events card in `index.html` renders only title, date, location, and description — the `image` column is not displayed anywhere in the current UI. The backend change (allowing video uploads) is enough; there is nothing to render on the frontend.

---

## Frontend — News Display (`news.html`)

Where a news item currently renders its image attachment:

```
if item.videoUrl  → <video src="${item.videoUrl}" controls style="width:100%;border-radius:8px;"></video>
else if item.imageData → <img src="${item.imageData}" ...>
```

No lightbox needed — native video controls are sufficient for inline news content.

---

## Constraints & Decisions

- **200MB file size limit** enforced on all three routes.
- **Allowed video formats:** mp4, webm, mov, m4v, ogg (broad browser support; mp4 is most common).
- **No schema migration** — videos stored in the existing `image` column, type detected by extension.
- **No cloud storage** — files stored locally in `backend/src/uploads/` (existing pattern).
- **Gallery lightbox closes cleanly** — video is paused and src cleared on close to prevent background playback.

---

## Out of Scope

- Video transcoding or compression
- Video thumbnails generated server-side
- Progress bars for large uploads
- Cloud/CDN storage
