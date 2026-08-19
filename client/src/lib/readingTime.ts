const CJK_CHARACTER = /[\u3400-\u9fff\uf900-\ufaff]/g;
const LATIN_WORD = /[A-Za-z0-9]+(?:['-][A-Za-z0-9]+)*/g;

function readableText(content: string) {
  return content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[>#*_`~|]/g, " ");
}

export function estimateReadingMinutes(content: string) {
  const text = readableText(content);
  const cjkCharacters = text.match(CJK_CHARACTER)?.length ?? 0;
  const nonCjkText = text.replace(CJK_CHARACTER, " ");
  const latinWords = nonCjkText.match(LATIN_WORD)?.length ?? 0;
  return Math.max(1, Math.ceil(cjkCharacters / 300 + latinWords / 200));
}

export function formatReadingTime(content: string) {
  return `${String(estimateReadingMinutes(content)).padStart(2, "0")} MIN READ`;
}
