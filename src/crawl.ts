import { JSDOM } from "jsdom";

export function normalizeURL(url: string): string {
  const parsed = new URL(url);
  const path = parsed.pathname.endsWith("/")
    ? parsed.pathname.slice(0, -1)
    : parsed.pathname;
  return `${parsed.host}${path}`;
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

export type ExtractedPageData = {
  url: string;
  heading: string;
  firstParagraph: string;
  outgoingLinks: string[];
  imageURLs: string[];
};

export function extractPageData(
  html: string,
  pageURL: string,
): ExtractedPageData {
  return {
    url: pageURL,
    heading: getHeadingFromHTML(html),
    firstParagraph: getFirstParagraphFromHTML(html),
    outgoingLinks: getURLsFromHTML(html, pageURL),
    imageURLs: getImagesFromHTML(html, pageURL),
  };
}

export async function getHTML(url: string) {
  try {
    const response: Response = await fetch(url, {
      headers: {
        "User-Agent": "BootCrawler/1.0",
        Accept: "text/html",
      },
    });

    if (response.status > 400) {
      console.error(
        `Response error fetching from: ${url}: ${response.status}: ${response.statusText}!`,
      );
      return;
    }

    if (!response.headers.get("content-type")?.includes("text/html")) {
      console.error(`Response from ${url} is not HTML!`);
      return;
    }

    return response.text();
  } catch (error) {
    console.error(`Error while fetching from: ${url}: ${error}`);
    return;
  }
}

export async function crawlPage(
  baseURL: string,
  currentURL: string,
  pages: Record<string, number> = {},
) {
  const baseURLNormalized = normalizeURL(baseURL);
  const currentURLNormalized = normalizeURL(currentURL);

  // check domain for current URL
  // return if differebt than the base URL
  if (!currentURLNormalized.startsWith(baseURLNormalized)) {
    return pages;
  }

  if (currentURLNormalized in pages) {
    pages[currentURLNormalized] += 1;
    return pages;
  } else {
    pages[currentURLNormalized] = 1;
  }

  console.log(`Fetching from: ${currentURL}`);

  const html = await getHTML(currentURL);
  if (!html) {
    console.error(`!!! Couldn't fetch HTML from: ${currentURL}`);
    return pages;
  }
  const urls = getURLsFromHTML(html, baseURL);

  // recursivelly fetch each URL found
  for (let url of urls) {
    pages = await crawlPage(baseURL, url, pages);
  }

  return pages;
}
