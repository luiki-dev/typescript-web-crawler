import { JSDOM } from "jsdom";
import { resourceLimits } from "node:worker_threads";

export function normalizeURL(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.endsWith("/")
      ? parsed.pathname.slice(0, -1)
      : parsed.pathname;
    return `${parsed.host}${path}`;
  } catch (e) {
    console.error(`Cannot parse URL: ${url}; Error: ${e}`);
    return undefined;
  }
}

export function getHeadingFromHTML(html: string): string {
  const dom = new JSDOM(html);
  let result = "";

  const h1s = dom.window.document.querySelectorAll("h1");
  if (h1s.length == 0) {
    const h2s = dom.window.document.querySelectorAll("h2");
    if (h2s.length == 0) {
      result = "";
    } else {
      result = h2s[0].textContent;
    }
  } else {
    result = h1s[0].textContent;
  }

  return result;
}
