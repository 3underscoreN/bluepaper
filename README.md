# Bluepaper

Bluepaper reads a personal social-media export from a `.zip` and shows the posts, photos, friends and messages inside it. It runs in the browser.

The zip is read with `File.slice()` and `DecompressionStream`, so the file never gets uploaded. The only network requests happen when you click a link to somewhere else. Standard and ZIP64 archives both work.

## Run it

1. Get the `.zip` from your data download.
2. Open `index.html` in a current browser (Chrome, Edge, Firefox, Safari 16.4+). You can double-click the file.
3. Pick the zip, or drag it onto the page.

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

Paths are matched by suffix, so an extra wrapper folder in the zip is fine. Double-encoded text such as `ã±ã«...` is repaired while parsing.

## What you can do

- Like a post, comment on it, or write a new text post
- Open photos and videos in a lightbox; arrow keys move between items
- Search friends, posts and message text
- Filter photos by album or show only videos
- Open a chat and send a reply
- Filter friends and chats, switch activity tabs, open a friend card

Likes, comments, new posts and replies stay in memory and disappear when you refresh. The zip itself is never changed. Only the language and theme are saved.

## Limits

- One zip at a time. Multi-part exports are not merged, and encrypted or multi-disk archives are not supported.
- ZIP64 works, but a very large single media file still has to be decompressed into memory.
- Message photos and files only appear if the export included them.
- Friend photos are not in the basic export, so friends show initials.
- Sharing is off. Nothing leaves the page except links you click.
- This is an unofficial viewer. It is not affiliated with any social network.

## Self-test

```sh
node test/selftest.mjs
```

The test covers mojibake repair, date formatting, nested-path lookup, standard and ZIP64 parsing, and matching keys in the two dictionaries.

## About this build

This project was generated in one shot by an AI coding agent, then tested against the export in this folder and a small ZIP64 fixture. Other export versions may still need parser changes.
