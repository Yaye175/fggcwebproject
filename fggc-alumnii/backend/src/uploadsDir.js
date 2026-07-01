const path = require('path');

// Single source of truth for where uploaded media lives.
// Defaults to src/uploads for local dev; set UPLOADS_DIR to a mounted
// persistent volume (e.g. /data/uploads on Railway) so uploads survive redeploys.
module.exports = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
