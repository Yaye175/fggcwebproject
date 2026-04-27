# Video Upload for PRO Admins — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow PRO admins to upload videos (up to 200MB) in all three upload sections (gallery, news, events), display them correctly in the gallery and news pages, and fix an existing bug where the gallery frontend references `img.dataUrl` instead of `img.url`.

**Architecture:** Unified media field approach — video files are accepted in the same multer `image` field and stored in the existing DB columns. The backend detects file type by extension at read time and returns either `imageData` (base64) or `videoUrl` (path) accordingly. No schema changes required.

**Tech Stack:** Node.js, Express, multer (file uploads), vanilla JS, HTML/CSS

---

## Files Changed

| File | Action | Reason |
|------|--------|--------|
| `backend/src/routes/gallery.js` | Modify | Add fileFilter + 200MB size limit |
| `backend/src/routes/news.js` | Modify | Extend fileFilter to allow video in image field + size limit + videoUrl in GET |
| `backend/src/routes/events.js` | Modify | Add fileFilter + 200MB size limit |
| `frontend/admin-dashboard.html` | Modify | Update news + events form inputs to accept video |
| `frontend/gallery.html` | Modify | Fix dataUrl bug, add video thumbnail rendering, update lightbox |
| `frontend/css/styles.css` | Modify | Add CSS for gallery video thumbnail overlay |
| `frontend/news.html` | Modify | Render `<video>` when item has videoUrl |

---

## Task 1: Backend — gallery.js file filter and size limit

**Files:**
- Modify: `backend/src/routes/gallery.js:12-20`

- [ ] **Step 1: Replace the multer config**

Open `backend/src/routes/gallery.js`. Replace lines 12–20:

```js
// BEFORE
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'));
    }
});
const upload = multer({ storage });
```

With:

```js
const ALLOWED_GALLERY = /^(jpg|jpeg|png|gif|webp|mp4|webm|mov|m4v|ogg)$/i;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).slice(1);
        if (ALLOWED_GALLERY.test(ext)) return cb(null, true);
        cb(new Error(`File type .${ext} not allowed. Use jpg, png, gif, webp, mp4, webm, mov, m4v, or ogg.`));
    }
});
```

- [ ] **Step 2: Verify the POST route already handles multer errors**

Check that the POST `/gallery` route (line ~51) uses `upload.single('media')` inline. Multer errors thrown by `fileFilter` will be caught automatically by Express error handling — no extra change needed here.

- [ ] **Step 3: Manually test rejection**

Start the server (`cd backend && node src/index.js`). Open the admin dashboard, try uploading a `.txt` file to the gallery. You should get: `Error: File type .txt not allowed.`

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/gallery.js
git commit -m "feat: add file filter and 200MB limit to gallery upload"
```

---

## Task 2: Backend — news.js extend filter and add videoUrl to GET

**Files:**
- Modify: `backend/src/routes/news.js:20-33` (multer config)
- Modify: `backend/src/routes/news.js:68-72` (GET enrichment)

- [ ] **Step 1: Add video to the multer fileFilter and add size limit**

Open `backend/src/routes/news.js`. Replace lines 20–33:

```js
// BEFORE
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedImage = /jpeg|jpg|png|gif|webp/i;
        const allowedDoc   = /pdf|doc|docx|txt/i;
        const ext = path.extname(file.originalname).slice(1);
        if (file.fieldname === 'image' && allowedImage.test(ext)) return cb(null, true);
        if (file.fieldname === 'document' && allowedDoc.test(ext)) return cb(null, true);
        cb(new Error(`File type .${ext} is not allowed for field "${file.fieldname}"`));
    }
}).fields([
    { name: 'image',    maxCount: 1 },
    { name: 'document', maxCount: 1 }
]);
```

With:

```js
const ALLOWED_NEWS_VIDEO = /^(mp4|webm|mov|m4v|ogg)$/i;

const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedImage = /^(jpeg|jpg|png|gif|webp)$/i;
        const allowedDoc   = /^(pdf|doc|docx|txt)$/i;
        const ext = path.extname(file.originalname).slice(1);
        if (file.fieldname === 'image' && (allowedImage.test(ext) || ALLOWED_NEWS_VIDEO.test(ext))) return cb(null, true);
        if (file.fieldname === 'document' && allowedDoc.test(ext)) return cb(null, true);
        cb(new Error(`File type .${ext} is not allowed for field "${file.fieldname}"`));
    }
}).fields([
    { name: 'image',    maxCount: 1 },
    { name: 'document', maxCount: 1 }
]);
```

- [ ] **Step 2: Update the GET enrichment to return videoUrl instead of base64 for videos**

In the GET `/news` handler, find the block that reads the image file (around line 68–72):

```js
// BEFORE
if (item.image) {
    result.imageData = toDataUrl(path.join(uploadsDir, path.basename(item.image)));
}
```

Replace with:

```js
if (item.image) {
    const ext = path.extname(item.image).slice(1).toLowerCase();
    if (ALLOWED_NEWS_VIDEO.test(ext)) {
        result.videoUrl = item.image;
    } else {
        result.imageData = toDataUrl(path.join(uploadsDir, path.basename(item.image)));
    }
}
```

Also apply the same pattern in the `GET /news/latest-story` handler (around line 95–98):

```js
// BEFORE
if (story.image) {
    story.imageData = toDataUrl(path.join(uploadsDir, path.basename(story.image)));
}
```

Replace with:

```js
if (story.image) {
    const ext = path.extname(story.image).slice(1).toLowerCase();
    if (ALLOWED_NEWS_VIDEO.test(ext)) {
        story.videoUrl = story.image;
    } else {
        story.imageData = toDataUrl(path.join(uploadsDir, path.basename(story.image)));
    }
}
```

- [ ] **Step 3: Manually test**

Start/restart the server. Upload a news item with a `.mp4` file via the admin panel. Then open `http://localhost:5000/news?type=news` in the browser. The returned JSON item should have `videoUrl: "/uploads/..."` and no `imageData` key.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/news.js
git commit -m "feat: allow video in news image field, return videoUrl in GET response"
```

---

## Task 3: Backend — events.js file filter and size limit

**Files:**
- Modify: `backend/src/routes/events.js:11-19`

- [ ] **Step 1: Replace the multer config**

Open `backend/src/routes/events.js`. Replace lines 11–19:

```js
// BEFORE
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });
```

With:

```js
const ALLOWED_EVENTS = /^(jpg|jpeg|png|gif|webp|mp4|webm|mov|m4v|ogg)$/i;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).slice(1);
        if (ALLOWED_EVENTS.test(ext)) return cb(null, true);
        cb(new Error(`File type .${ext} not allowed. Use jpg, png, gif, webp, mp4, webm, mov, m4v, or ogg.`));
    }
});
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/routes/events.js
git commit -m "feat: add file filter and 200MB limit to events upload"
```

---

## Task 4: Frontend — admin-dashboard.html form inputs

**Files:**
- Modify: `frontend/admin-dashboard.html`

- [ ] **Step 1: Update the news image input (label + accept)**

Find this block in `admin-dashboard.html` (around line 119–122):

```html
<div class="form-group">
    <label>Image (Optional)</label>
    <input type="file" id="news-image" accept="image/*">
</div>
```

Replace with:

```html
<div class="form-group">
    <label>Image or Video (Optional)</label>
    <input type="file" id="news-image" accept="image/*,video/*">
</div>
```

- [ ] **Step 2: Add an image/video input to the events form**

The events form currently has no media input. Find the events form's last `form-group` before the submit button (around line 150–153):

```html
        <div class="form-group">
            <label>Description</label>
            <textarea id="event-description" rows="3"
                style="width:100%;border:1.5px solid var(--border-color);border-radius:var(--r-sm);padding:0.65rem;font-family:'Inter',sans-serif;font-size:0.9rem;background:rgba(255,255,255,0.7);resize:vertical;"></textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;">Create Event</button>
```

Replace with:

```html
        <div class="form-group">
            <label>Description</label>
            <textarea id="event-description" rows="3"
                style="width:100%;border:1.5px solid var(--border-color);border-radius:var(--r-sm);padding:0.65rem;font-family:'Inter',sans-serif;font-size:0.9rem;background:rgba(255,255,255,0.7);resize:vertical;"></textarea>
        </div>
        <div class="form-group">
            <label>Image or Video (Optional)</label>
            <input type="file" id="event-media" accept="image/*,video/*">
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;">Create Event</button>
```

- [ ] **Step 3: Wire the events media field into the FormData**

Find the event form submit handler (around line 298–308):

```js
document.getElementById('pro-event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await withLoadingBtn(e.target, () => {
        const formData = new FormData();
        formData.append('title', document.getElementById('event-title').value);
        formData.append('event_date', document.getElementById('event-date').value);
        formData.append('location', document.getElementById('event-location').value);
        formData.append('description', document.getElementById('event-description').value);
        return handleUpload('/events', formData);
    });
});
```

Replace with:

```js
document.getElementById('pro-event-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await withLoadingBtn(e.target, () => {
        const formData = new FormData();
        formData.append('title', document.getElementById('event-title').value);
        formData.append('event_date', document.getElementById('event-date').value);
        formData.append('location', document.getElementById('event-location').value);
        formData.append('description', document.getElementById('event-description').value);
        const media = document.getElementById('event-media').files[0];
        if (media) formData.append('image', media);
        return handleUpload('/events', formData);
    });
});
```

- [ ] **Step 4: Manually test**

Open the admin dashboard PRO tab. Confirm the news form shows "Image or Video (Optional)" and accepts `.mp4` files. Confirm the events form shows a new "Image or Video (Optional)" input.

- [ ] **Step 5: Commit**

```bash
git add frontend/admin-dashboard.html
git commit -m "feat: update admin forms to accept video uploads"
```

---

## Task 5: Frontend — gallery.html bug fix, video rendering, and lightbox

**Files:**
- Modify: `frontend/gallery.html`
- Modify: `frontend/css/styles.css`

- [ ] **Step 1: Add CSS for video thumbnails**

Open `frontend/css/styles.css` and append at the very end:

```css
/* Gallery video thumbnails */
.gallery-video-thumb {
    position: relative;
    width: 100%;
    height: 100%;
    background: #0a1e30;
    border-radius: inherit;
    overflow: hidden;
}

.gallery-video-thumb video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.gallery-play-btn {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
}

.gallery-video-badge {
    position: absolute;
    bottom: 6px;
    right: 8px;
    background: rgba(0, 0, 0, 0.65);
    color: #fff;
    font-size: 0.65rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    padding: 2px 6px;
    border-radius: 4px;
    pointer-events: none;
}
```

- [ ] **Step 2: Add lightbox video element to the HTML**

In `gallery.html`, find the lightbox HTML (around line 47–51):

```html
<div id="lightbox">
    <button id="lightbox-close">&times;</button>
    <img id="lightbox-img" src="" alt="">
    <div id="lightbox-caption"></div>
</div>
```

Replace with:

```html
<div id="lightbox">
    <button id="lightbox-close">&times;</button>
    <img id="lightbox-img" src="" alt="" style="max-width:100%;max-height:80vh;">
    <video id="lightbox-video" controls style="max-width:100%;max-height:80vh;display:none;"></video>
    <div id="lightbox-caption"></div>
</div>
```

- [ ] **Step 3: Replace the inline script block in gallery.html**

The three `<script src="...">` lines (api.js, auth.js, animations.js) stay untouched. Find only the inline `<script>` block that starts after them (around line 56) and replace everything from `<script>` to its closing `</script>` with:

```html
<script>
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxVideo = document.getElementById('lightbox-video');
    const lightboxCaption = document.getElementById('lightbox-caption');

    function openLightbox(item) {
        if (item.type === 'video') {
            lightboxImg.style.display = 'none';
            lightboxVideo.src = item.url;
            lightboxVideo.style.display = 'block';
        } else {
            lightboxVideo.style.display = 'none';
            lightboxImg.src = item.url;
            lightboxImg.style.display = 'block';
        }
        lightboxCaption.textContent = item.caption || '';
        lightboxCaption.style.display = item.caption ? 'block' : 'none';
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        lightboxImg.src = '';
        lightboxVideo.pause();
        lightboxVideo.src = '';
        document.body.style.overflow = '';
    }

    document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

    document.addEventListener('DOMContentLoaded', async () => {
        const container = document.getElementById('gallery-container');
        try {
            const images = await api.get('/gallery');
            if (images.length === 0) {
                container.innerHTML = '<p>No images available in the gallery yet.</p>';
                return;
            }
            container.innerHTML = images.map((img, i) => `
                <div class="gallery-item" data-index="${i}">
                    ${img.type === 'video'
                        ? `<div class="gallery-video-thumb">
                               <video src="${img.url}" muted preload="metadata"></video>
                               <div class="gallery-play-btn">
                                   <svg viewBox="0 0 24 24" width="40" height="40">
                                       <circle cx="12" cy="12" r="12" fill="rgba(255,255,255,0.92)"/>
                                       <polygon points="10,7 19,12 10,17" fill="#0D2B4E"/>
                                   </svg>
                               </div>
                               <span class="gallery-video-badge">VIDEO</span>
                           </div>`
                        : `<img src="${img.url}" alt="${img.caption || 'Alumni Event'}">`
                    }
                    ${img.caption ? `<div class="gal-caption">${img.caption}</div>` : ''}
                </div>
            `).join('');

            container.querySelectorAll('.gallery-item[data-index]').forEach((el, i) => {
                el.addEventListener('click', () => openLightbox(images[i]));
            });
        } catch (error) {
            container.innerHTML = '<p>Failed to load gallery images.</p>';
        }
    });
</script>
```

- [ ] **Step 4: Manually test images**

Open `gallery.html` in the browser (with the backend running). Existing images should now display — previously they were invisible due to the `dataUrl` bug. Click one to open the lightbox. It should show the image and close with Escape.

- [ ] **Step 5: Manually test videos**

Upload an `.mp4` to the gallery via the admin panel. Reload `gallery.html`. The video should appear with a play-button overlay and "VIDEO" badge. Click it — the lightbox should open and play the video with controls. Close the lightbox — the video should stop.

- [ ] **Step 6: Commit**

```bash
git add frontend/gallery.html frontend/css/styles.css
git commit -m "feat: fix gallery dataUrl bug, add video thumbnail and lightbox player"
```

---

## Task 6: Frontend — news.html video rendering

**Files:**
- Modify: `frontend/news.html:70`

- [ ] **Step 1: Update the image/video rendering in the news list**

Open `frontend/news.html`. Find line 70:

```js
${item.imageData ? `<img src="${item.imageData}" alt="News Image">` : ''}
```

Replace with:

```js
${item.videoUrl
    ? `<video src="${item.videoUrl}" controls style="width:100%;border-radius:8px;margin-bottom:0.75rem;"></video>`
    : item.imageData
        ? `<img src="${item.imageData}" alt="News Image">`
        : ''
}
```

- [ ] **Step 2: Manually test**

Upload a news item with a `.mp4` video via the admin panel. Open `news.html`. The post should show an inline video player with native controls. An existing news item with an image should still show the image unchanged.

- [ ] **Step 3: Commit**

```bash
git add frontend/news.html
git commit -m "feat: render video player in news posts when videoUrl is present"
```

---

## Done

All six tasks complete. The PRO admin can now upload videos in all three forms. Gallery shows video thumbnails with play overlay and lightbox player. News posts render inline video. 200MB limit enforced on all routes. The pre-existing gallery `dataUrl` bug is also fixed.
