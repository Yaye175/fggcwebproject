# Multi-file gallery upload — design

**Date:** 2026-07-18
**Requested by:** PRO admin — "be able to upload multiple media files at once."

## Goal

Let the PRO admin select and upload several images/videos to the gallery in one
action, giving each file its own caption, instead of uploading one file at a time.

## Current behavior

- **Frontend** (`fggc-alumnii/frontend/admin-dashboard.html`, "Upload to Gallery"
  form): one file input `#gallery-media` + one `#gallery-caption` text box. On
  submit it appends a single `caption` and a single `media` file to `FormData`
  and POSTs to `/gallery` via `handleUpload`.
- **Backend** (`fggc-alumnii/backend/src/routes/gallery.js`, `POST /gallery`):
  guarded by `authMiddleware` + `proAdminMiddleware`, uses
  `upload.single('media')` (multer, disk storage, 200 MB limit, allowed
  image/video extensions), and inserts one row into the `gallery` table
  (`filename`, `caption`).

## Chosen approach: per-file captions, single batch request

The admin picks multiple files; the UI renders one row per file (thumbnail +
caption input); everything is sent in a single multipart request where files and
captions are index-aligned. Each file becomes its own `gallery` row, exactly as
today — no schema change.

### Frontend changes (`admin-dashboard.html`)

- Add `multiple` to `#gallery-media`; remove the single top-level caption box.
- On `change`, render a dynamic list (`#gallery-file-list`), one row per selected
  file:
  - **Thumbnail:** for images, an `<img>` from `URL.createObjectURL(file)`;
    for videos, a filename chip / icon (no video thumbnail generation).
  - **Caption input:** one text input per file.
  - Revoke object URLs when the list is re-rendered or the form resets, to avoid
    leaks.
- On submit, build one `FormData`: for each selected file (in order) append the
  file under `media` and its caption under `captions`. Files and captions share
  the same order so index _i_ pairs file ↔ caption.
- Client-side guards: require at least one file; cap at 20 files with a friendly
  message; keep submitting through the existing `handleUpload` /
  `withLoadingBtn` helpers. On success, reset the form and clear the list.

### Backend changes (`gallery.js`)

- Replace `upload.single('media')` with `upload.array('media', 20)`.
- Normalize `req.body.captions` to an array (multer yields a string when only one
  `captions` field is present, an array when several).
- Validate `req.files` is non-empty (400 otherwise).
- Insert one row per file in a loop, pairing `req.files[i]` with
  `captions[i] || ''`. Respond `201` with `{ message, inserted: <count> }`.
- Unchanged: `authMiddleware` + `proAdminMiddleware`, the per-file `fileFilter`
  (allowed extensions) and 200 MB `limits.fileSize` — both apply per file under
  `.array`.

## Explicitly out of scope (YAGNI)

- No `gallery` schema change — one row per file, as today.
- No transaction/rollback across the batch.
- No edit/delete gallery UI.
- No drag-and-drop, no video thumbnail generation.

## Failure behavior

All-or-nothing per batch: if any file fails multer's type/size filter, multer
rejects the whole request (a `400` with the offending message), and nothing is
inserted. This matches the current single-file behavior and is predictable for
the admin. Per-file partial success (skip bad files, keep good ones) is a larger
change and intentionally not included.

## Batch limit

20 files per upload, enforced both client-side (friendly message) and in
`upload.array('media', 20)` (multer returns a `LIMIT_UNEXPECTED_FILE` / count
error that the existing error handler surfaces as a `400`).
