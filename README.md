# USPTO ODP Extension

Adds an `X-API-KEY` header to requests made to the USPTO Open Data Portal API.

Copyright © 2026 Tamir Zegman.

Example API URL: https://api.uspto.gov/api/v1/patent/ptab-files/IPR/2012/00001/168820640.pdf

## Load the extension in Chrome
1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this folder.
4. Use the toolbar popup to open settings and save your key.

## Notes
- The key is stored locally via `chrome.storage.local`.
- Only requests matching `https://api.uspto.gov/api/*` receive the header.
- Use the toggle to pause injection without deleting the key.
- The **Validate key** button tests the key against a small USPTO API request.
- Optional: enable PDF inline mode to set `Content-Disposition: inline` for USPTO API PDFs.
- Optional: force PDF responses to `Content-Type: application/pdf` to avoid downloads.
