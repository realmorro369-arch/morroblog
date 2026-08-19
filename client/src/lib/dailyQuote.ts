export type DailyQuote = {
  text: string;
  source: string;
};

export const observatoryQuotes: DailyQuote[] = [
  { text: "问题不会因为仓促命名而变得简单。", source: "MorroBlog · 此刻一言" },
  { text: "先留下证据，再给结论一个位置。", source: "MorroBlog · 此刻一言" },
  { text: "能复现的过程，才值得被写下来。", source: "MorroBlog · 此刻一言" },
  { text: "不必什么都快，先把一件事做明白。", source: "MorroBlog · 此刻一言" },
  { text: "把判断放在证据之后。", source: "MorroBlog · 此刻一言" },
  { text: "工具的价值，常常在第二次遇见问题时出现。", source: "MorroBlog · 此刻一言" },
  { text: "答案或许会迟到，过程不能省略。", source: "MorroBlog · 此刻一言" },
];

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function getQuoteIndexForDate(date = new Date()) {
  const seed = Array.from(dateKey(date)).reduce((total, character) => total + character.charCodeAt(0), 0);
  return seed % observatoryQuotes.length;
}

export function getAdjacentQuoteIndex(currentIndex: number, direction: 1 | -1) {
  return (currentIndex + direction + observatoryQuotes.length) % observatoryQuotes.length;
}
