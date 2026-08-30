export function normalizeURL(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.endsWith("/")
      ? parsed.pathname.slice(0, -1)
      : parsed.pathname;
    return `${parsed.host}${path}`;
  } catch (e) {
    console.error(`Cannot parse URL: ${url}; Error: ${e}`);
    return undefined;
  }
}
