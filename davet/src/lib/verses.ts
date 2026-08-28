import type { Locale, Tradition } from "./types";

/**
 * Stored by key rather than copied text, so changing an invitation's language
 * re-renders the verse without the couple retyping anything.
 * Translations are interpretations of meaning, not literal renderings.
 */
export type LibraryVerse = {
  key: string;
  tradition: Tradition;
  /** Original-script line, shown above the translation. Null where there
   *  is no established original-script line to set. */
  original: string | null;
  ref: Record<Locale, string>;
  text: Record<Locale, string>;
};

export const VERSE_LIBRARY: LibraryVerse[] = [
  {
    key: "ar-rum-30-21",
    tradition: "islamic",
    original:
      "وَمِنْ آيَاتِهِ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَاجًا لِّتَسْكُنُوا إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً",
    ref: {
      en: "Surah Ar-Rum · 30:21",
      de: "Sure ar-Rum · 30:21",
      tr: "Rûm Sûresi · 30:21",
    },
    text: {
      en: "Among His signs is that He created for you, from yourselves, mates so that you may find peace in them — and He placed between you love and mercy.",
      de: "Zu Seinen Zeichen gehört, dass Er euch aus euch selbst Gefährten erschuf, damit ihr bei ihnen Ruhe findet — und Er legte zwischen euch Liebe und Barmherzigkeit.",
      tr: "O'nun ayetlerinden biri de, kendilerinde huzur bulasınız diye size kendi türünüzden eşler yaratması ve aranıza sevgi ve merhamet koymasıdır.",
    },
  },
  {
    key: "an-nisa-4-1",
    tradition: "islamic",
    original:
      "يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمُ الَّذِي خَلَقَكُم مِّن نَّفْسٍ وَاحِدَةٍ وَخَلَقَ مِنْهَا زَوْجَهَا",
    ref: {
      en: "Surah An-Nisa · 4:1",
      de: "Sure an-Nisa · 4:1",
      tr: "Nisâ Sûresi · 4:1",
    },
    text: {
      en: "He created you from a single soul, and from it created its mate, and from the two of them spread forth countless souls.",
      de: "Er erschuf euch aus einer einzigen Seele und schuf aus ihr ihren Gefährten, und aus beiden liess Er unzählige Menschen hervorgehen.",
      tr: "Sizi bir tek nefisten yaratan, ondan da eşini var eden ve ikisinden birçok insanı yayan Rabbinize karşı gelmekten sakının.",
    },
  },
  {
    key: "al-baqarah-2-187",
    tradition: "islamic",
    original: "هُنَّ لِبَاسٌ لَّكُمْ وَأَنتُمْ لِبَاسٌ لَّهُنَّ",
    ref: {
      en: "Surah Al-Baqarah · 2:187",
      de: "Sure al-Baqara · 2:187",
      tr: "Bakara Sûresi · 2:187",
    },
    text: {
      en: "They are a garment for you, and you are a garment for them — each shielding, comforting and completing the other.",
      de: "Sie sind ein Gewand für euch, und ihr seid ein Gewand für sie — einander Schutz, Trost und Ergänzung.",
      tr: "Onlar size örtüdür, siz de onlara örtüsünüz — birbirinizi koruyan, avutan ve tamamlayan.",
    },
  },
  {
    key: "adh-dhariyat-51-49",
    tradition: "islamic",
    original: "وَمِن كُلِّ شَيْءٍ خَلَقْنَا زَوْجَيْنِ لَعَلَّكُمْ تَذَكَّرُونَ",
    ref: {
      en: "Surah Adh-Dhariyat · 51:49",
      de: "Sure adh-Dhariyat · 51:49",
      tr: "Zâriyât Sûresi · 51:49",
    },
    text: {
      en: "Of every created thing We made pairs, that you may reflect.",
      de: "Von allem erschufen Wir ein Paar, auf dass ihr nachdenken möget.",
      tr: "Her şeyden çift çift yarattık ki düşünüp öğüt alasınız.",
    },
  },
  {
    key: "an-naba-78-8",
    tradition: "islamic",
    original: "وَخَلَقْنَاكُمْ أَزْوَاجًا",
    ref: {
      en: "Surah An-Naba · 78:8",
      de: "Sure an-Naba · 78:8",
      tr: "Nebe Sûresi · 78:8",
    },
    text: {
      en: "And We created you in pairs.",
      de: "Und Wir erschufen euch als Paare.",
      tr: "Sizi çiftler hâlinde yarattık.",
    },
  },
  {
    key: "al-furqan-25-74",
    tradition: "islamic",
    original: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ",
    ref: {
      en: "Surah Al-Furqan · 25:74",
      de: "Sure al-Furqan · 25:74",
      tr: "Furkân Sûresi · 25:74",
    },
    text: {
      en: "Our Lord, grant us joy in our spouses and our children.",
      de: "Unser Herr, schenke uns an unseren Gefährten und Kindern Freude.",
      tr: "Rabbimiz, eşlerimizi ve çocuklarımızı bize göz aydınlığı kıl.",
    },
  },
  // Christian ---------------------------------------------------------------
  {
    key: "1-cor-13-4",
    tradition: "christian",
    original: null,
    ref: {
      en: "1 Corinthians 13:4–7",
      de: "1. Korinther 13,4–7",
      tr: "1. Korintliler 13:4-7",
    },
    text: {
      en: "Love is patient, love is kind. It bears all things, believes all things, hopes all things, endures all things.",
      de: "Die Liebe ist langmütig und freundlich. Sie erträgt alles, sie glaubt alles, sie hofft alles, sie duldet alles.",
      tr: "Sevgi sabırlıdır, sevgi şefkatlidir. Her şeye katlanır, her şeye inanır, her şeyi umut eder, her şeye dayanır.",
    },
  },
  {
    key: "gen-2-24",
    tradition: "christian",
    original: null,
    ref: { en: "Genesis 2:24", de: "1. Mose 2,24", tr: "Yaratılış 2:24" },
    text: {
      en: "Therefore a man shall leave his father and his mother and hold fast to his wife, and they shall become one flesh.",
      de: "Darum wird ein Mann seinen Vater und seine Mutter verlassen und seiner Frau anhangen, und sie werden ein Fleisch sein.",
      tr: "Bu nedenle adam annesini babasını bırakıp karısına bağlanacak, ikisi tek beden olacak.",
    },
  },
  {
    key: "eccl-4-9",
    tradition: "christian",
    original: null,
    ref: { en: "Ecclesiastes 4:9", de: "Prediger 4,9", tr: "Vaiz 4:9" },
    text: {
      en: "Two are better than one, because they have a good reward for their toil.",
      de: "So ist es besser zu zweien als allein; denn sie haben guten Lohn für ihre Mühe.",
      tr: "İki kişi bir kişiden iyidir, çünkü emeklerine iyi karşılık alırlar.",
    },
  },
  {
    key: "col-3-14",
    tradition: "christian",
    original: null,
    ref: { en: "Colossians 3:14", de: "Kolosser 3,14", tr: "Koloseliler 3:14" },
    text: {
      en: "And above all these put on love, which binds everything together in perfect harmony.",
      de: "Über alles aber zieht an die Liebe, die da ist das Band der Vollkommenheit.",
      tr: "Bunların hepsinin üzerine sevgiyi giyinin; sevgi mükemmel birliğin bağıdır.",
    },
  },
  {
    key: "song-8-7",
    tradition: "christian",
    original: null,
    ref: { en: "Song of Songs 8:7", de: "Hohelied 8,7", tr: "Ezgiler Ezgisi 8:7" },
    text: {
      en: "Many waters cannot quench love, neither can floods drown it.",
      de: "Viele Wasser können die Liebe nicht auslöschen, noch können Ströme sie ertränken.",
      tr: "Çok sular sevgiyi söndüremez, ırmaklar onu boğamaz.",
    },
  },
  {
    key: "mark-10-9",
    tradition: "christian",
    original: null,
    ref: { en: "Mark 10:9", de: "Markus 10,9", tr: "Markos 10:9" },
    text: {
      en: "What therefore God has joined together, let not man separate.",
      de: "Was nun Gott zusammengefügt hat, das soll der Mensch nicht scheiden.",
      tr: "Tanrı'nın birleştirdiğini insan ayırmasın.",
    },
  },
];

export const VERSES_BY_KEY = new Map(VERSE_LIBRARY.map((v) => [v.key, v]));

export function versesFor(tradition: Tradition): LibraryVerse[] {
  return VERSE_LIBRARY.filter((v) => v.tradition === tradition);
}

export const BISMILLAH = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
