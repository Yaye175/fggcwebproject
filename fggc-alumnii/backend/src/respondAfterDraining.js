const crypto = require('crypto');

// When multer aborts an upload (rejected type, file too big) it stops reading
// the socket while the client is often still streaming megabytes. Replying
// right then resets the connection, and the browser reports a bare network
// failure — on iOS Safari, "TypeError: Load failed" — instead of the reason.
// Drain what is left of the request first so the JSON message actually
// reaches the client.
const respondAfterDraining = (req, res, status, body) => {
    const send = () => { if (!res.headersSent) res.status(status).json(body); };
    if (req.readableEnded || req.complete) return send();

    const timer = setTimeout(send, 5000); // don't wait forever on a stalled upload
    req.on('end', () => { clearTimeout(timer); send(); });
    req.on('error', () => { clearTimeout(timer); send(); });
    req.unpipe();
    req.resume();
};

// Shared multer filename builder. Date.now() alone is not unique: iOS names
// every photo picked from the library "image.jpg", and files in one batch (or
// two admins uploading at once) land in the same millisecond and overwrite
// each other. Random bytes make collisions impossible.
const uniqueFilename = (originalname) => {
    const suffix = crypto.randomBytes(6).toString('hex');
    return `${Date.now()}-${suffix}-${originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`;
};

module.exports = { respondAfterDraining, uniqueFilename };
