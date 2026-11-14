// Keep these in sync with public/sw.js.
const SHARE_CACHE = "nanti-share";
const SHARE_FILE_KEY = "/__share/file";
const SHARE_TEXT_KEY = "/__share/text";

// Matches the server-side limit on analyzeConversation input.
export const MAX_ANALYZE_CHARS = 20000;

// Clears the stash on read so a reload does not import the same chat twice.
export async function takeSharedContent(): Promise<File | string | null> {
  if (typeof caches === "undefined") return null;
  try {
    if (!(await caches.has(SHARE_CACHE))) return null;
    const cache = await caches.open(SHARE_CACHE);
    const [fileRes, textRes] = await Promise.all([
      cache.match(SHARE_FILE_KEY),
      cache.match(SHARE_TEXT_KEY),
    ]);
    let shared: File | string | null = null;
    if (fileRes) {
      const blob = await fileRes.blob();
      const name = decodeURIComponent(fileRes.headers.get("X-File-Name") || "shared.txt");
      shared = new File([blob], name, {
        type: fileRes.headers.get("Content-Type") || blob.type || "text/plain",
      });
    } else if (textRes) {
      shared = (await textRes.text()).trim() || null;
    }
    await caches.delete(SHARE_CACHE);
    return shared;
  } catch (error) {
    console.error("Reading shared content failed:", error);
    return null;
  }
}

// Keeps the tail: an exported chat ends with its newest messages, where open commitments are.
export function latestChatSlice(text: string, max = MAX_ANALYZE_CHARS) {
  const clean = text.trim();
  if (clean.length <= max) return { text: clean, trimmed: false };
  const tail = clean.slice(-max);
  const firstBreak = tail.indexOf("\n");
  return {
    text: firstBreak >= 0 && firstBreak < tail.length - 1 ? tail.slice(firstBreak + 1) : tail,
    trimmed: true,
  };
}
