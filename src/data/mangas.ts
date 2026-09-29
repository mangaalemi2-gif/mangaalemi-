export interface MangaMeta {
  slug: string;
  title: string;
  author: string;
  year: number;
  description: string;
  genres: string[];
  coverExt: string;
}

export const MANGAS: MangaMeta[] = [
  {
    slug: "dragon-ball-1984",
    title: "Dragon Ball",
    author: "Akira Toriyama",
    year: 1984,
    description: "Son Goku, derin dağlarda tek başına yaşayan saf ve güçlü bir çocuktur. Bulma ile tanışması onu efsanevi Dragon Ball'ların peşinde destansı bir maceraya sürükler.",
    genres: ["Aksiyon", "Macera", "Komedi", "Shounen"],
    coverExt: "png",
  },
  {
    slug: "chainsaw-man",
    title: "Chainsaw Man",
    author: "Tatsuki Fujimoto",
    year: 2018,
    description: "Denji, borçlarını ödemek için iblis avlayan fakir bir gençtir. Pochita adında testere iblisi bir köpeği vardır ve kaderi onu korkunç bir güce kavuşturur.",
    genres: ["Aksiyon", "Karanlık Fantezi", "Korku", "Shounen"],
    coverExt: "webp",
  },
  {
    slug: "demon-slayer",
    title: "Demon Slayer (Kimetsu no Yaiba)",
    author: "Koyoharu Gotouge",
    year: 2016,
    description: "Ailesi iblisler tarafından katledilen ve kız kardeşi Nezuko bir iblise dönüşen Tanjirou'nun intikam ve kurtuluş hikayesi.",
    genres: ["Aksiyon", "Macera", "Doğaüstü", "Shounen"],
    coverExt: "jpg",
  },
  {
    slug: "naruto",
    title: "Naruto",
    author: "Masashi Kishimoto",
    year: 1999,
    description: "İçinde dokuz kuyruklu tilki mühürlü olan Naruto Uzumaki'nin Hokage olma yolundaki serüveni.",
    genres: ["Aksiyon", "Macera", "Dövüş Sanatları", "Shounen"],
    coverExt: "webp",
  },
];

export const ALL_GENRES = [...new Set(MANGAS.flatMap((m) => m.genres))].sort();

export function getManga(slug: string): MangaMeta | undefined {
  return MANGAS.find((m) => m.slug === slug);
}

export function mangaCover(m: MangaMeta): string {
  return `/mangas/${m.slug}/cover.${m.coverExt}`;
}
