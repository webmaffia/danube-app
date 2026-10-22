// Rewrites display text into what a voice should say: "AED 1.25M" becomes
// "1.25 million dirhams", "sq ft" becomes "square feet", "7–10" becomes "7 to 10".
// The transcript keeps the written form.

export function forSpeech(text: string): string {
  return text
    // A link is shown as a card, never read out.
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\bAED\s?([\d,.]+)\s?M\b/g, "$1 million dirhams")
    .replace(/\bAED\s?([\d,.]+)\s?K\b/g, "$1 thousand dirhams")
    .replace(/\bAED\s?([\d,.]+)\s*(million|thousand)\b/gi, "$1 $2 dirhams")
    .replace(/\bAED\s?([\d,.]+)/g, "$1 dirhams")
    .replace(/\bsq\.?\s?ft\b/gi, "square feet")
    .replace(/(\d)\s?km\b/g, "$1 kilometres")
    .replace(/(\d)\s?m\b/g, "$1 metres")
    .replace(/(\d)\s?[–-]\s?(\d)/g, "$1 to $2")
    .replace(/\b([A-Z]{2})-(\d{2})(\d{2})\b/g, (_, letters: string, floor: string, flat: string) => `unit ${letters.split("").join(" ")} ${floor} ${flat}`)
    .replace(/\bDLD\b/g, "D L D")
    .replace(/\bRERA\b/g, "Rera");
}
