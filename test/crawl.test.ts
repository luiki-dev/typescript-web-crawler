import {
  getFirstParagraphFromHTML,
  getHeadingFromHTML,
  getImagesFromHTML,
  getURLsFromHTML,
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
  ])("normalizeURL(%i) -> %i", ([a, expected]) => {
      expect(normalizeURL(a)).toBe(expected);
  });

  test("normalizeURL throws exception", () => {
    expect(() => normalizeURL("terefere")).toThrow();
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

describe("getURLsFromHTML test", () => {
  test("getURLsFromHTML absolute", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><a href="/path/one"><span>Boot.dev</span></a></body></html>`;
    const expected = ["https://crawler-test.com/path/one"];

    const actual = getURLsFromHTML(inputBody, inputURL);

    expect(actual).toEqual(expected);
  });

  test("getURLsFromHTML all a found", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><a href="/path/one"><span>Boot.dev</span></a><p><a href="https://crawler-test.com/path/two"><span>Boot.dev absolute</span></a></p></body></html>`;
    const expected = [
      "https://crawler-test.com/path/one",
      "https://crawler-test.com/path/two",
    ];

    const actual = getURLsFromHTML(inputBody, inputURL);

    expect(actual).toEqual(expected);
  });

  test("getURLsFromHTML no links", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><span>Boot.dev</span><p><span>Boot.dev absolute</span></p></body></html>`;
    const expected: string[] = [];

    const actual = getURLsFromHTML(inputBody, inputURL);

    expect(actual).toEqual(expected);
  });
});

describe("getImagesFromHTML test", () => {
  test("getImagesFromHTML relative", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><img src="/logo.png" alt="Logo"></body></html>`;

    const actual = getImagesFromHTML(inputBody, inputURL);
    const expected = ["https://crawler-test.com/logo.png"];

    expect(actual).toEqual(expected);
  });

  test("getImagesFromHTML all found", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><img src="/logo.png" alt="Logo"><p><img src="https://somewherelse.com/footer.png" alt="Footer"></p></body></html>`;

    const actual = getImagesFromHTML(inputBody, inputURL);
    const expected = [
      "https://crawler-test.com/logo.png",
      "https://somewherelse.com/footer.png",
    ];

    expect(actual).toEqual(expected);
  });

  test("getImagesFromHTML missing src attribute", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><img alt="Logo"><p><img src="/footer.png" alt="Footer"></p></body></html>`;

    const actual = getImagesFromHTML(inputBody, inputURL);
    const expected = ["https://crawler-test.com/footer.png"];

    expect(actual).toEqual(expected);
  });

  test("getImagesFromHTML no images with links", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><img alt="Logo"><p></p></body></html>`;

    const actual = getImagesFromHTML(inputBody, inputURL);
    const expected: string[] = [];

    expect(actual).toEqual(expected);
  });
});
