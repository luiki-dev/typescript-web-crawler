import { argv, exit } from "process";
import { ConcurrentCrawler, ExtractedPageData } from "./crawl";
import { writeJSONReport } from "./report";

const DEFAULT_MAX_CONCURRENCY = 3;
const DEFAULT_MAX_PAGES = 25;

async function main() {
  const args: string[] = argv.slice(2);

  if (args.length < 1) {
    console.error("Missing Base URL argument!");
    exit(1);
  }

  if (args.length > 3) {
    console.error("Too many arguments!");
    exit(1);
  }

  const baseURL = args[0];
  const maxConcurrency = args[1] ? Number(args[1]) : DEFAULT_MAX_CONCURRENCY;
  const maxPages = args[2] ? Number(args[2]) : DEFAULT_MAX_PAGES;

  console.log(`CRAWLING!`);
  console.log(`Max Concurency: ${maxConcurrency}`);
  console.log(`Max Pages: ${maxPages}`);
  console.log(`Base URL to be processed: ${baseURL}`);
  console.log("=============================");

  const crawledPages: Record<string, ExtractedPageData> = await crawlSiteAsync(
    baseURL,
    maxConcurrency,
    maxPages,
  );

  console.log("=============================");
  console.log(`Crawled ${Object.keys(crawledPages).length} pages:`);

  writeJSONReport(crawledPages, "report.json");

  exit(0);
}

async function crawlSiteAsync(
  baseURL: string,
  maxConcurrency: number,
  maxPages: number,
) {
  const crawler: ConcurrentCrawler = new ConcurrentCrawler(
    baseURL,
    maxConcurrency,
    maxPages,
  );
  return await crawler.crawl();
}

main();
