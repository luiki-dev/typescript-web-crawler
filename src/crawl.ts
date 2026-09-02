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
  #pages: Record<string, ExtractedPageData>;
  #visited: Set<string>;
  #limit: any;
  #maxPages: number;
  #shouldStop: boolean = false;
  #allTasks: Set<Promise<void>>;

  constructor(baseURL: string, maxConcurrency: number, maxPages: number) {
    this.#baseURL = baseURL;
    this.#pages = {};
    this.#visited = new Set<string>();
    this.#limit = pLimit(maxConcurrency);
    this.#maxPages = maxPages;
    this.#allTasks = new Set<Promise<void>>();
  }

  private addPageVisit(normalizedURL: string): boolean {
    if (this.#shouldStop) {
      return false;
    }

    if (this.#visited.has(normalizedURL)) {
      return false;
    }

    if (this.#visited.size >= this.#maxPages) {
      this.#shouldStop = true;
      console.log("Reached maximum number of pages to crawl.");
      return false;
    }

    this.#visited.add(normalizedURL);
    return true;
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
          throw new Error(
            `Response error fetching from: ${url}: ${response.status}: ${response.statusText}!`,
          );
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
    if (this.#shouldStop) {
      return;
    }

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
    const data = extractPageData(html, currentURL);
    this.#pages[currentURLNormalized] = data;

    const urlPromises = [];
    for (let url of data.outgoingLinks) {
      let task: Promise<void> = this.crawlPage(url);
      this.#allTasks.add(task);
      urlPromises.push(task);
      task.finally(() => {
        this.#allTasks.delete(task);
      });
    }

    await Promise.all(urlPromises);
  }

  async crawl() {
    await this.crawlPage(this.#baseURL);
    return this.#pages;
  }
}
