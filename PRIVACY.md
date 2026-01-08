# Privacy Policy

Effective date: 2026-01-01

## Overview
The USPTO ODP Extension stores a user-provided API key and injects it as an HTTP header for requests to USPTO API endpoints. This extension does not collect, transmit, or sell personal data to any third party.

## Data we collect
- API key (entered by the user)

## How data is used
- The API key is stored locally in the browser using Chrome extension storage.
- The API key is sent only as the `X-API-KEY` request header to USPTO API endpoints:
  - https://api.uspto.gov/api/*
  - https://data-documents.uspto.gov/*
  - https://data.uspto.gov/*

## Data sharing
- The API key is not shared with the extension developer or any third party.
- The key is only sent to USPTO API endpoints as described above.

## Data retention
- The API key remains stored locally until the user removes or replaces it via the extension options.

## Security
- The API key is stored locally in the browser profile. It is not encrypted by the extension.

## Contact
For questions, contact: https://github.com/zegman/odp-extension/issues
