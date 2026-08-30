import {
  getFirstParagraphFromHTML,
  getHeadingFromHTML,
  normalizeURL,
} from "../src/crawl";

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
  ] as [string, string | undefined][])(
    "normalizeURL(%i) -> %i",
    ([a, expected]) => {
      expect(normalizeURL(a)).toBe(expected);
    },
  );
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

describe("getFirstParagraphFromHTML tests", () => {
  test("getFirstParagraphFromHTML find first p in main", () => {
    const inputBody = `
    <html><body>
      <p>Outside paragraph.</p>
      <main>
        <p>Main paragraph.</p>
      </main>
    </body></html>
  `;
    const expected = "Main paragraph.";
    const actual = getFirstParagraphFromHTML(inputBody);
    expect(actual).toEqual(expected);
  });

  test("getFirstParagraphFromHTML find first p when no main", () => {
    const inputBody = `
    <html><body>
      <p>Outside paragraph.</p>
      <p>Main paragraph.</p>
    </body></html>
  `;
    const expected = "Outside paragraph.";
    const actual = getFirstParagraphFromHTML(inputBody);
    expect(actual).toEqual(expected);
  });

  test("getFirstParagraphFromHTML no p found", () => {
    const inputBody = `
    <html><body>
      <h1>Just title/h1>
    </body></html>
  `;
    const expected = "";
    const actual = getFirstParagraphFromHTML(inputBody);
    expect(actual).toEqual(expected);
  });
});
