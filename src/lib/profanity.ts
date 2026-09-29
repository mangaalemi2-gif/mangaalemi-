// Basit küfür/argo filtresi — client + server ortak kullanır.
// Ağır hakaretleri yıldızlar, hafifleri olduğu gibi bırakır.

const BAD_WORDS = [
  "amk", "aq",
  "orospu", "oruspu",
  "piç",
  "siktir", "sokuk", "sokayım",
  "yarrak", "yarak",
  "amcık", "amcik",
  "götveren", "gotveren",
  "yavşak", "yavsak",
  "ibne",
  "kahpe",
  "şerefsiz", "serefsiz",
  "oç",
];

const pattern = new RegExp(`(^|[^\\p{L}])(${BAD_WORDS.join("|")})(?![\\p{L}])`, "giu");

export function maskProfanity(text: string): string {
  if (!text) return text;
  return text.replace(pattern, (_m, pre: string, word: string) => {
    return pre + "*".repeat(Math.min(Math.max(word.length, 3), 8));
  });
}

export function containsProfanity(text: string): boolean {
  if (!text) return false;
  pattern.lastIndex = 0;
  return pattern.test(text);
}
