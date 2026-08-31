import { argv, exit } from "process";
import { crawlPage } from "./crawl";

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

  const crawledPages: Record<string, number> = await crawlPage(
    baseURL,
    baseURL,
  );

  console.log("=============================");
  console.log("Crawled pages:");
  console.log(crawledPages);

  exit(0);
}

main();
