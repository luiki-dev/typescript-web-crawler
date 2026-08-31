import { argv, exit } from "process";
import { getHTML } from "./crawl";

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

  const html = await getHTML(baseURL);

  console.log(html);

  exit(0);
}

main();
