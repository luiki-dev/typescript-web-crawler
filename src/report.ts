import { writeFileSync } from "node:fs";
import { ExtractedPageData } from "./crawl";
import path from "node:path";

export function writeJSONReport(
  pageData: Record<string, ExtractedPageData>,
  filename = "report.json",
): void {
  const sortedPageData: [string, ExtractedPageData][] = Object.entries(
    pageData,
  ).sort(([a], [b]) => a.localeCompare(b));

  const jsonedPageData = JSON.stringify(sortedPageData, null, 2);

  const filePath = path.resolve(process.cwd(), filename);
  writeFileSync(filePath, jsonedPageData);

  console.log(`Wrote report to: ${filePath}`);
}
