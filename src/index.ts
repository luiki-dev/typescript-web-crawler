import { argv, exit } from "process";
import { ConcurrentCrawler } from "./crawl";

const MAX_CONCURRENCY = 3;

async function main() {
  const args: string[] = argv.slice(2);

  if (args.length < 1) {
    console.error("Missing Base URL argument!");
    exit(1);
  }

  if (args.length > 1) {
    console.error("Too many arguments!");
    exit(1);
  }

  const baseURL = args[0];
  console.log(`Base URL to be processed: ${baseURL}`);
  console.log("=============================");

  const crawledPages: Record<string, number> = await crawlSiteAsync(baseURL);

  console.log("=============================");
  console.log("Crawled pages:");
  console.log(crawledPages);

  exit(0);
}

async function crawlSiteAsync(baseURL: string) {
  const crawler: ConcurrentCrawler = new ConcurrentCrawler(
    baseURL,
    MAX_CONCURRENCY,
  );
  return await crawler.crawl();
}

main();
