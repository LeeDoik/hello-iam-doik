## Problem

Every new game meant repeating the same chores. Export a web build from Godot, move it into the site, write the title, description and thumbnail into some file, commit, then check that the deploy went through. It took enough hands-on time that importing a game felt more expensive than making it, and skipping any one step left the game either missing from the list or listed but not playable.

The import also relied on memory. Reusing a slug from an older game, or getting one character of a file path wrong, still built fine and only broke on screen. Mistakes travelled quietly all the way to production before anyone noticed.

The brand assets drifted the same way. The logo and banners were made in a design tool, so the colors chosen there differed slightly from the colors the site actually used. Fixing one side left the other stale — there were two sources of truth.

## Approach

The first decision was that a game is a data record. The build lives under `public/games/<slug>/`, and a game is registered by one file, `content/games/<n>-<slug>.json`. Tests check that slugs do not collide and that the files a record points at really exist, so an import mistake fails a test instead of reaching a deploy. To avoid writing those records by hand, I built `/editor`: the form sits next to a live preview that renders the real card and list components, so the result can be seen and corrected before saving.

The save button does not stop at writing the file — it commits and pushes. Staging is restricted to `content/` so the editor cannot sweep unrelated code changes along with it, and the button needs two presses before anything actually leaves. Anything hard to undo keeps a place where a person has to step in once more.

Color drift was solved by moving the renderer into code. The logic that draws the logo and banners on `/brand` was separated into pure functions with no DOM dependency, which made it possible to pin the palette and layout with unit tests. There are two palettes — NIGHT, in night-sky tones, and DMG, in Game Boy tones — and the site and the assets read the same values.

For the game side of the chores I added a Chrome side-panel extension that carries a freshly exported build through to redeployment without leaving the browser: the same move the editor made for content.

Deployment is on Vercel, and Claude Code was used as an assistant during development. Nothing calls an LLM at runtime; the site only reads static assets and JSON records and renders them. The editor, because it touches local files and git, opens only on the dev server and does not exist in the deployed build. The domain still carries the earlier name, neo-kido.

## Result

275 commits went in over three weeks, and three games were imported, two of them public. Adding a new game is now a matter of creating one JSON record, and that record is created in the editor.

Over the last 30 days there were 67 visitors and 190 page views — the 2026-08-03 to 09-01 window in Vercel Analytics — arriving mostly from Threads and DCInside. Not large numbers, but it was the first time I handed my own games to other people with a single link.

On screen, switching palettes now affects the site and the brand assets at once. The landing wordmark, the game list and the in-game top bar all read the same palette values, so changing a color means changing one place.

## What I learned

Turning a chore into data registration makes handling that data the next problem. The moment a game became one line of JSON, writing JSON by hand became the new chore, which is why the editor had to exist. What ended up being the product was not the list of games but the tool that manages it.

Two sources of truth will drift eventually. Once the palette and fonts were shared from code and asset rendering read the same values, there was no longer a place for a mismatch to appear. Choosing colors in code turned out cheaper to maintain than choosing them in a design tool.

Automate what is hard to undo, but keep the confirmation. The editor's commit and push are automatic, yet narrowing the staging scope and requiring two presses means it has still never produced a commit I had to take back.

The content model of this portfolio site inherits directly from that. One project is one directory, its metadata is validated by a schema, and its assets sit next to it as files — the same conclusion that came out of treating games as JSON records, moved into another domain.
