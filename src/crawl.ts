import { JSDOM } from "jsdom";

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
  const { document } = new JSDOM(html).window;
  let result = "";

  const h1s = document.querySelectorAll("h1");
  if (h1s.length == 0) {
    const h2s = document.querySelectorAll("h2");
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

export function getFirstParagraphFromHTML(html: string): string {
  const { document } = new JSDOM(html).window;

  const main = document.querySelector("main");
  if (main) {
    return getFirstParagraph(main);
  } else {
    return getFirstParagraph(document);
  }
}

function getFirstParagraph(element: ParentNode): string {
  const firstP = element.querySelector("p");
  if (firstP) {
    return firstP.textContent;
  } else {
    return "";
  }
}

function extractLinksFromHTMLElement(
  html: string,
  element: string,
  linkAttribute: string,
  baseURL: string,
): string[] {
  const { document } = new JSDOM(html).window;
  const urls = [];

  for (let e of document.querySelectorAll(element)) {
    const link = e.getAttribute(linkAttribute);
    if (link) {
      urls.push(new URL(link, baseURL).toString());
    } else {
      continue;
    }
  }

  return urls;
}

export function getURLsFromHTML(html: string, baseURL: string): string[] {
  return extractLinksFromHTMLElement(html, "a", "href", baseURL);
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
  return extractLinksFromHTMLElement(html, "img", "src", baseURL);
}
