# Bluepaper

Bluepaper reads a personal social-media export from one or more `.zip` files and shows the posts, photos, friends and messages inside it. It runs in the browser.

It reads the zip files with `File.slice()` and `DecompressionStream`, so nothing gets uploaded. The only network requests happen when you click a link to somewhere else. Standard and ZIP64 archives both work, and the parts of a split export are merged before the viewer opens.

## Run it

1. Get the `.zip` from your data download. If there are several parts, keep them all.
2. Open `index.html` in a current browser (Chrome, Edge, Firefox, Safari 16.4+). You can double-click the file.
3. Pick one zip, or select every part. You can also drag several files in at once.

If your browser blocks local files, serve the folder:

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

## Languages and appearance

The interface starts in Traditional Chinese. The button in the top-right corner switches to English, and the choice is saved in `localStorage` under `bluepaper.lang`. Only the interface is translated; posts and messages appear as exported.

On first run the theme follows the operating system. The sun/moon button toggles light and dark mode, saved under `bluepaper.theme`.

Translations are in `i18n/en.js` and `i18n/zh-Hant.js`. They load as plain scripts, so `file://` works. Keep the `i18n/` folder beside `index.html` when you host it.

## What it reads

- Profile details plus profile and cover pictures
- Pages and groups
- Timeline posts and statuses, including `archive.json`
- Photos, videos and albums under `your_facebook_activity/posts/media`
- Messages from `inbox` and `archived_threads`, with shares and attachments when the export has them
- Comments, reactions and saved items
- Friends

All selected parts are read together, so a split export behaves like one archive. Paths are matched by suffix, so an extra wrapper folder in the zip is fine. Double-encoded text such as `ã±ã«...` is repaired while parsing.

## What stays in memory

The zip files are never read into memory whole. Bluepaper reads each zip's central directory, then slices one entry from the file when it needs it. JSON files are parsed into memory. Photos load as they come near the viewport, and videos load when you open them. The browser keeps those decoded media blobs for the rest of the session.

That is fine for small and medium exports. A very large messages file, or a single multi-gigabyte video, can still exhaust memory. Splitting an export into parts helps with download size. It does not make one huge media file smaller.

## What you can do

- Like a post, comment on it, or write a new text post
- Open photos and videos in a lightbox; arrow keys move between items
- Search friends, posts and message text
- Filter photos by album or show only videos
- Open a chat and send a reply
- Filter friends and chats, switch activity tabs, open a friend card

Likes, comments, new posts and replies stay in memory and disappear when you refresh. The zip itself is never changed. Only the language and theme are saved.

## Limits

- Multiple parts are merged, but encrypted entries and multi-disk archives are not supported.
- Message photos and files only appear if the export included them.
- Friend photos are not in the basic export, so friends show initials.
- Sharing is off. Nothing leaves the page except links you click.
- This is an unofficial viewer. It is not affiliated with any social network.

## Self-test

```sh
node test/selftest.mjs
```

The test covers mojibake repair, date formatting, nested-path lookup, ZIP64 parsing, reading two archive parts, and matching keys in the two dictionaries.

## About this build

This project was generated in one shot by an AI coding agent, then tested against a full export, a two-part synthetic export, and a small ZIP64 fixture. Other export versions may still need parser changes.
