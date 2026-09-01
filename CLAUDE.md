# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A boot.dev course project ("Build a Web Scraper"): a CLI that concurrently crawls a website starting from a base URL, staying within that domain, and reports a count of visits per normalized URL.

## Commands

- `npm start <baseURL>` — run the crawler CLI against a given base URL (runs `src/index.ts` via `tsx`, no build step needed).
- `npm run debug` — run the crawler against a fixed practice site (`https://learnwebscraping.dev/practice/ecommerce/`).
- `npm test` — run the full test suite once via `vitest run`.
- `npx vitest run -t "<test name>"` — run a single test by name.
- `npx vitest run test/crawl.test.ts` — run a single test file.
- `npx prettier --write .` — format the codebase (prettier is a devDependency; there is no committed prettier config, so defaults apply).

There is no separate build, lint, or typecheck script defined in `package.json`; TypeScript is run directly via `tsx` and type errors surface at runtime/edit-time only. Use `npx tsc --noEmit` if you need an explicit typecheck pass.

Node version is pinned via `.nvmrc` (22.15.0).

## Architecture

The codebase is intentionally small and split into two files:

- `src/crawl.ts` — all crawling and HTML-extraction logic.
- `src/index.ts` — CLI entry point: parses `argv`, invokes the crawler, prints results.

### HTML extraction functions

A set of pure functions parse an HTML string (via `jsdom`) and pull out specific data: `getHeadingFromHTML` (first `h1`, falling back to first `h2`), `getFirstParagraphFromHTML` (first `p` inside `main` if present, else first `p` anywhere), `getURLsFromHTML`/`getImagesFromHTML` (resolve `a[href]`/`img[src]` against a base URL), and `extractPageData` which bundles all of the above into one `ExtractedPageData` object. These are unit-tested directly in `test/crawl.test.ts` without needing a real crawl.

### `normalizeURL`

Strips protocol, and trailing slash from a URL's pathname, producing a `host + path` string used as the dedup key for visited pages (e.g. `https://www.boot.dev/blog/path/` and `http://www.boot.dev/blog/path` normalize to the same key). Throws if given a string that isn't a valid URL.

### `ConcurrentCrawler`

Recursive, concurrency-limited crawl driver (uses `p-limit` to cap in-flight `fetch` calls):

- `crawl()` kicks off `crawlPage(baseURL)` and returns `this.pages`, a `Record<normalizedURL, visitCount>`.
- `crawlPage(url)` normalizes the URL, skips it if it's off-domain (doesn't start with the normalized base URL) or already visited, otherwise fetches its HTML, extracts outgoing links via `getURLsFromHTML`, and recurses into each one concurrently (`Promise.all` over recursive calls — note this is fire-and-forget from the caller's perspective, since `crawl()` doesn't await the recursion tree before returning `this.pages`).
- `getHTML(url)` wraps `fetch` with a custom `User-Agent`/`Accept: text/html` header, and returns `undefined` (with a logged error) on non-HTML responses, HTTP status > 400, or fetch exceptions — callers must check for a falsy result.
- `addPageVisit(url)` is the dedup/visit-counting gate: returns `true` only the first time a normalized URL is seen (which is what allows `crawlPage` to decide whether to actually crawl vs. just increment a count).

When modifying crawl behavior, keep in mind the visit-counting side effect happens in `addPageVisit` before the HTML fetch, so a URL is counted as "visited" even if the fetch subsequently fails.
