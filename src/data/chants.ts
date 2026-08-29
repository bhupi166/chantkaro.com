import type { PracticeOption } from '@/lib/types';

/**
 * Suggested chants and prayers, organized by tradition.
 *
 * This list is intentionally data-only so phrases can be added, corrected or
 * hidden (set `hidden: true`) without touching any counter/UI logic.
 *
 * Traditions are listed alphabetically by internal key, not by any notion of
 * importance. Phrases marked `needsReview: true` are shown to users as-is
 * (they are in common devotional use) but are flagged in
 * REVIEW_NEEDED.md for final expert/community verification before this
 * project is treated as a definitive source.
 */
export const CHANTS: PracticeOption[] = [
  // ---- Sanatan / Hindu ----
  {
    id: 'sanatan-radhe-radhe',
    category: 'chant',
    tradition: 'sanatan',
    title: 'Radhe Radhe',
    script: 'राधे राधे',
    scriptLang: 'hi',
  },
  {
    id: 'sanatan-hare-krishna',
    category: 'chant',
    tradition: 'sanatan',
    title:
      'Hare Krishna Hare Krishna, Krishna Krishna Hare Hare; Hare Rama Hare Rama, Rama Rama Hare Hare',
    script: 'हरे कृष्ण हरे कृष्ण, कृष्ण कृष्ण हरे हरे। हरे राम हरे राम, राम राम हरे हरे॥',
    scriptLang: 'hi',
  },
  {
    id: 'sanatan-om-namah-shivaya',
    category: 'chant',
    tradition: 'sanatan',
    title: 'Om Namah Shivaya',
    script: 'ॐ नमः शिवाय',
    scriptLang: 'hi',
  },
  {
    id: 'sanatan-shri-ram',
    category: 'chant',
    tradition: 'sanatan',
    title: 'Shri Ram Jai Ram Jai Jai Ram',
    script: 'श्री राम जय राम जय जय राम',
    scriptLang: 'hi',
  },
  {
    id: 'sanatan-om-namo-bhagavate-vasudevaya',
    category: 'chant',
    tradition: 'sanatan',
    title: 'Om Namo Bhagavate Vasudevaya',
    script: 'ॐ नमो भगवते वासुदेवाय',
    scriptLang: 'hi',
  },
  {
    id: 'sanatan-om-shri-ganeshaya-namah',
    category: 'chant',
    tradition: 'sanatan',
    title: 'Om Shri Ganeshaya Namah',
    script: 'ॐ श्री गणेशाय नमः',
    scriptLang: 'hi',
  },
  {
    id: 'sanatan-om-hanumate-namah',
    category: 'chant',
    tradition: 'sanatan',
    title: 'Om Hanumate Namah',
    script: 'ॐ हनुमते नमः',
    scriptLang: 'hi',
  },
  {
    id: 'sanatan-jai-shri-ram',
    category: 'chant',
    tradition: 'sanatan',
    title: 'Jai Shri Ram',
    script: 'जय श्री राम',
    scriptLang: 'hi',
  },
  {
    id: 'sanatan-jai-mata-di',
    category: 'chant',
    tradition: 'sanatan',
    title: 'Jai Mata Di',
    script: 'जय माता दी',
    scriptLang: 'hi',
  },
  {
    id: 'sanatan-om-shanti',
    category: 'chant',
    tradition: 'sanatan',
    title: 'Om Shanti',
    script: 'ॐ शान्तिः',
    scriptLang: 'hi',
  },

  // ---- Sikh Simran ----
  {
    id: 'sikh-waheguru',
    category: 'chant',
    tradition: 'sikh',
    title: 'Waheguru',
    script: 'ਵਾਹਿਗੁਰੂ',
    scriptLang: 'pa',
  },
  {
    id: 'sikh-satnam-waheguru',
    category: 'chant',
    tradition: 'sikh',
    title: 'Satnam Waheguru',
    script: 'ਸਤਿਨਾਮ ਵਾਹਿਗੁਰੂ',
    scriptLang: 'pa',
  },
  {
    id: 'sikh-ik-onkar',
    category: 'chant',
    tradition: 'sikh',
    title: 'Ik Onkar',
    script: 'ੴ',
    scriptLang: 'pa',
  },

  // ---- Buddhist ----
  {
    id: 'buddhist-om-mani-padme-hum',
    category: 'chant',
    tradition: 'buddhist',
    title: 'Om Mani Padme Hum',
    script: 'ॐ मणि पद्मे हूँ',
    scriptLang: 'hi',
  },
  {
    id: 'buddhist-buddham-sharanam',
    category: 'chant',
    tradition: 'buddhist',
    title: 'Buddham Sharanam Gacchami',
    script: 'बुद्धं शरणं गच्छामि',
    scriptLang: 'hi',
  },
  {
    id: 'buddhist-om-tare-tuttare',
    category: 'chant',
    tradition: 'buddhist',
    title: 'Om Tare Tuttare Ture Soha',
  },

  // ---- Jain ----
  // Only the Namokar (Navkar) Mantra is included — it is the one Jain text
  // whose wording is essentially universal across sects, cross-checked
  // against Wikipedia's "Namokar Mantra" article and jaina.org's own
  // published text (both agree). Other Jain suggestions are deliberately
  // left out rather than guessed at; add more here once reviewed.
  {
    id: 'jain-namokar-mantra',
    category: 'chant',
    tradition: 'jain',
    title: 'Namokar Mantra (Navkar Mantra)',
    script:
      'णमो अरिहंताणं। णमो सिद्धाणं। णमो आयरियाणं। णमो उवज्झायाणं। णमो लोए सव्व साहूणं। एसो पंच णमोक्कारो, सव्व पावप्पणासणो। मंगलाणं च सव्वेसिं, पढमं हवइ मंगलं॥',
    scriptLang: 'hi',
  },

  // ---- Islamic Dhikr/Zikr ----
  {
    id: 'islamic-subhanallah',
    category: 'chant',
    tradition: 'islamic',
    title: 'SubhanAllah',
    script: 'سُبْحَانَ ٱللَّٰهِ',
    scriptLang: 'ar',
  },
  {
    id: 'islamic-alhamdulillah',
    category: 'chant',
    tradition: 'islamic',
    title: 'Alhamdulillah',
    script: 'ٱلْحَمْدُ لِلَّٰهِ',
    scriptLang: 'ar',
  },
  {
    id: 'islamic-allahu-akbar',
    category: 'chant',
    tradition: 'islamic',
    title: 'Allahu Akbar',
    script: 'ٱللَّٰهُ أَكْبَرُ',
    scriptLang: 'ar',
  },
  {
    id: 'islamic-la-ilaha-illallah',
    category: 'chant',
    tradition: 'islamic',
    title: 'La ilaha illallah',
    script: 'لَا إِلٰهَ إِلَّا ٱللَّٰهُ',
    scriptLang: 'ar',
  },
  {
    id: 'islamic-astaghfirullah',
    category: 'chant',
    tradition: 'islamic',
    title: 'Astaghfirullah',
    script: 'أَسْتَغْفِرُ ٱللَّٰهَ',
    scriptLang: 'ar',
  },

  // ---- Christian ----
  {
    id: 'christian-praise-the-lord',
    category: 'chant',
    tradition: 'christian',
    title: 'Praise the Lord',
  },
  {
    id: 'christian-hallelujah',
    category: 'chant',
    tradition: 'christian',
    title: 'Hallelujah',
  },
  {
    id: 'christian-jesus-mercy',
    category: 'chant',
    tradition: 'christian',
    title: 'Jesus, have mercy on me',
  },
  {
    id: 'christian-lord-jesus-mercy',
    category: 'chant',
    tradition: 'christian',
    title: 'Lord Jesus Christ, have mercy on me',
  },
  {
    id: 'christian-thank-you-god',
    category: 'chant',
    tradition: 'christian',
    title: 'Thank You, God',
  },
];

/** A small, neutral, order-preserved first-screen selection (spec §11). */
export const FEATURED_CHANT_IDS = [
  'sanatan-radhe-radhe',
  'sanatan-om-namah-shivaya',
  'sanatan-shri-ram',
  'sanatan-hare-krishna',
  'sikh-waheguru',
  'buddhist-om-mani-padme-hum',
  'islamic-subhanallah',
  'christian-praise-the-lord',
];

export const TRADITION_LABELS: Record<string, string> = {
  sanatan: 'Sanatan / Hindu',
  sikh: 'Sikh Simran',
  buddhist: 'Buddhist',
  jain: 'Jain',
  islamic: 'Dhikr / Zikr',
  christian: 'Christian',
  universal: 'Universal',
};

export function visibleChants(): PracticeOption[] {
  return CHANTS.filter((c) => !c.hidden);
}
