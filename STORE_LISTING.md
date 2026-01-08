# Chrome Web Store Listing Draft

## Name
USPTO ODP API Key Injector

## Short Description (max 132 chars)
Automatically adds your USPTO Open Data Portal API key to USPTO API requests.

## Detailed Description
The USPTO ODP Extension helps you use the USPTO Open Data Portal by automatically adding your API key to USPTO API requests.

Features:
- Stores your API key locally so you only enter it once.
- Adds the `X-API-KEY` header for requests to `https://api.uspto.gov/api/*`.
- Optional toggles to force PDF responses to open inline and set the correct PDF content type.
- Simple options page and popup for status.

This extension only operates on USPTO API domains and does not send data anywhere else.

## Category
Productivity

## Website / Support URL
https://github.com/zegman/odp-extension

## Support Email
INSERT_SUPPORT_EMAIL

## Privacy Policy URL
https://github.com/zegman/odp-extension/blob/main/PRIVACY.md

## Permission Rationale
- storage: Store the user-provided API key and settings locally.
- declarativeNetRequest: Add the `X-API-KEY` header to USPTO API requests and adjust PDF response headers.
- declarativeNetRequestWithHostAccess: Apply the above rules only to specified USPTO domains.
- declarativeNetRequestFeedback: Provide diagnostics (last match) to help users verify the rule applies.

## Host Permission Justification
- https://api.uspto.gov/*: Required to inject the `X-API-KEY` header for USPTO API requests and validate the API key.
- https://data-documents.uspto.gov/*: Required to set PDF response headers on USPTO document downloads after redirect.
- https://data.uspto.gov/*: Required to set PDF response headers on USPTO document downloads hosted on the data domain.

## Single Purpose Statement
This extension adds the user's USPTO Open Data Portal API key to USPTO API requests so authorized users can access USPTO data endpoints.
