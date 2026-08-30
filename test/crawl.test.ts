import { normalizeURL } from "../src/crawl";

const expectedURL = "www.boot.dev/blog/path";

test.for([
  ["https://www.boot.dev/blog/path/", expectedURL],
  ["https://www.boot.dev/blog/path", expectedURL],
  ["http://www.boot.dev/blog/path/", expectedURL],
  ["http://www.boot.dev/blog/path", expectedURL],
  ["https://www.boot.dev/blog/path/?ref=1", expectedURL],
  ["https://www.boot.dev/blog/path/index.html", expectedURL + "/index.html"],
])("normalizeURL(%s) -> %s", ([a, expected]) => {
  expect(normalizeURL(a)).toBe(expected);
});
