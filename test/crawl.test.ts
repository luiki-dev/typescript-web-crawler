import { getHeadingFromHTML, normalizeURL } from "../src/crawl";

describe("normalizeURL tests", () => {
  const expectedURL = "www.boot.dev/blog/path";

  test.for([
    ["https://www.boot.dev/blog/path/", expectedURL],
    ["https://www.boot.dev/blog/path", expectedURL],
    ["http://www.boot.dev/blog/path/", expectedURL],
    ["http://www.boot.dev/blog/path", expectedURL],
    ["https://www.boot.dev/blog/path/?ref=1", expectedURL],
    ["https://www.boot.dev/blog/path/index.html", expectedURL + "/index.html"],
    ["terefere", undefined],
  ])("normalizeURL(%s) -> %s", ([a, expected]) => {
    expect(normalizeURL(a)).toBe(expected);
  });
});

describe("getHeadingFrom tests", () => {
  test("getHeadingFromHTML finds first h1", () => {
    const input =
      "<html><body><h1>Test Title</h1><h1>Second title</h1></body></html>";
    const expected = "Test Title";
    const actual = getHeadingFromHTML(input);
    expect(actual).toBe(expected);
  });

  test("getHeadingFromHTML finds h2 if no h1", () => {
    const input = "<html><body><h2>Sub title</h2></body></html>";
    const expected = "Sub title";
    const actual = getHeadingFromHTML(input);
    expect(actual).toBe(expected);
  });

  test("getHeadingFromHTML empty when no h1 and h2", () => {
    const input = "<html><body>p>Text</p></body></html>";
    const expected = "";
    const actual = getHeadingFromHTML(input);
    expect(actual).toBe(expected);
  });
});
