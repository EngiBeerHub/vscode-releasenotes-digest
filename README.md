# Release Digest

Release Digest fetches the official release notes for your current VS Code version and uses the VS Code Language Model API to create a short Japanese digest.

## Usage

Run **Release Digest: 現在のVS Code Release Notesを要約** from the Command Palette. After VS Code updates, Release Digest also shows a one-time notification with an action to create the digest.

The result opens as an untitled Markdown document and includes a link to the official release notes.

## Requirements and privacy

- VS Code 1.91 or later.
- Access to a GitHub Copilot language model in VS Code. Model availability, consent, quota, and applicable terms are managed by VS Code and GitHub Copilot.
- The extension downloads the public release notes from `https://code.visualstudio.com` and sends the extracted public text to the language model selected through VS Code. It does not inspect workspace files or use an extension-owned server or API key.
- No accounts, telemetry, database, personalization, or release-note history are included in this MVP.

## Development

```sh
npm install
npm run check
```

Press F5 in VS Code to launch an Extension Development Host.
