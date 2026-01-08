# Contributing

Thanks for your interest in improving the USPTO ODP Extension.

## Local setup
1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this folder.
4. Use the toolbar popup to open settings and save your API key.

## Making changes
- Update the extension code, then reload the extension from the Extensions page.
- Use the options page and the popup to validate behavior.
- Check the Network panel for `X-API-KEY` on requests to `https://api.uspto.gov/api/*`.

## Reporting issues
- Include the URL being tested and any relevant response headers.
- Note which toggles are enabled in the options page.
