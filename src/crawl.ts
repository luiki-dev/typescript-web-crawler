import { JSDOM } from "jsdom";
import pLimit from "p-limit";

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

export class ConcurrentCrawler {
  #baseURL: string;
  #pages: Record<string, number>;
  #limit: any;

  constructor(baseURL: string, maxConcurrency: number) {
    this.#baseURL = baseURL;
    this.#pages = {};
    this.#limit = pLimit(maxConcurrency);
  }

  private addPageVisit(normalizedURL: string): boolean {
    if (normalizedURL in this.#pages) {
      this.#pages[normalizedURL] += 1;
      return false;
    } else {
      this.#pages[normalizedURL] = 1;
      return true;
    }
  }

  private async getHTML(url: string): Promise<string> {
    return await this.#limit(async () => {
      try {
        const response: Response = await fetch(url, {
          headers: {
            "User-Agent": "BootCrawler/1.0",
            Accept: "text/html",
          },
        });

        if (response.status > 400) {
          throw new Error(`Response error fetching from: ${url}: ${response.status}: ${response.statusText}!`);
        }

        if (!response.headers.get("content-type")?.includes("text/html")) {
          throw new Error(`Response from ${url} is not HTML!`);
        }

        return response.text();
      } catch (error) {
        console.error(`Error while fetching HTML: ${error}`);
        return;
      }
    });
  }

  private async crawlPage(currentURL: string): Promise<void> {
    const baseURLNormalized = normalizeURL(this.#baseURL);
    const currentURLNormalized = normalizeURL(currentURL);

    // check domain for current URL
    // return if differebt than the base URL
    if (!currentURLNormalized.startsWith(baseURLNormalized)) {
      return;
    }

    if (!this.addPageVisit(currentURLNormalized)) {
      return;
    }

    console.log(`Fetching from: ${currentURL}`);

    const html = await this.getHTML(currentURL);
    if (!html) {
      console.error(`!!! Couldn't fetch HTML from: ${currentURL}`);
      return;
    }
    const urls = getURLsFromHTML(html, this.#baseURL);

    const urlPromises = [];
    for (let url of urls) {
      urlPromises.push(this.crawlPage(url));
    }

    await Promise.all(urlPromises);
  }

  async crawl() {
    await this.crawlPage(this.#baseURL);
    return this.#pages;
  }
}
