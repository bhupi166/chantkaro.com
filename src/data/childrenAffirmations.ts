import type { PracticeOption } from '@/lib/types';

/**
 * Affirmations for children, focused on exams and everyday confidence.
 * Deliberately present-tense and pressure-free — no "don't fail", no
 * comparison to others, nothing framed around fear.
 *
 * Hindi/Punjabi translations were produced for this app rather than
 * sourced from a published reference; treat them as a solid first pass
 * and have a native speaker review before relying on them for anything
 * beyond in-app display.
 */
export const CHILDREN_AFFIRMATIONS: PracticeOption[] = [
  {
    id: 'child-exam-calm-confident',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I prepare for my exams calmly and confidently.',
    titleTranslations: {
      hi: 'मैं शांति और आत्मविश्वास के साथ अपनी परीक्षाओं की तैयारी करता/करती हूँ।',
      pa: 'ਮੈਂ ਸ਼ਾਂਤੀ ਅਤੇ ਭਰੋਸੇ ਨਾਲ ਆਪਣੇ ਇਮਤਿਹਾਨਾਂ ਦੀ ਤਿਆਰੀ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।',
    },
  },
  {
    id: 'child-best-no-pressure',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I do my best without putting too much pressure on myself.',
    titleTranslations: {
      hi: 'मैं खुद पर ज़्यादा दबाव डाले बिना अपना सर्वश्रेष्ठ प्रयास करता/करती हूँ।',
      pa: "ਮੈਂ ਆਪਣੇ ਆਪ 'ਤੇ ਬਹੁਤਾ ਦਬਾਅ ਪਾਏ ਬਿਨਾਂ ਆਪਣੀ ਪੂਰੀ ਕੋਸ਼ਿਸ਼ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।",
    },
  },
  {
    id: 'child-one-exam-not-define',
    category: 'affirmation',
    tradition: 'universal',
    title: 'One exam cannot define my abilities or my future.',
    titleTranslations: {
      hi: 'एक परीक्षा मेरी क्षमताओं या मेरे भविष्य को परिभाषित नहीं कर सकती।',
      pa: 'ਇੱਕ ਇਮਤਿਹਾਨ ਮੇਰੀਆਂ ਯੋਗਤਾਵਾਂ ਜਾਂ ਮੇਰੇ ਭਵਿੱਖ ਨੂੰ ਪਰਿਭਾਸ਼ਿਤ ਨਹੀਂ ਕਰ ਸਕਦਾ।',
    },
  },
  {
    id: 'child-calm-difficult-question',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I can remain calm even when a question feels difficult.',
    titleTranslations: {
      hi: 'जब कोई प्रश्न कठिन लगे तब भी मैं शांत रह सकता/सकती हूँ।',
      pa: 'ਜਦੋਂ ਕੋਈ ਸਵਾਲ ਔਖਾ ਲੱਗੇ ਤਾਂ ਵੀ ਮੈਂ ਸ਼ਾਂਤ ਰਹਿ ਸਕਦਾ/ਸਕਦੀ ਹਾਂ।',
    },
  },
  {
    id: 'child-practice-patience',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I understand more with practice and patience.',
    titleTranslations: {
      hi: 'अभ्यास और धैर्य से मैं और अधिक समझता/समझती हूँ।',
      pa: 'ਅਭਿਆਸ ਅਤੇ ਸਬਰ ਨਾਲ ਮੈਂ ਹੋਰ ਸਮਝਦਾ/ਸਮਝਦੀ ਹਾਂ।',
    },
  },
  {
    id: 'child-mistakes-help-learn',
    category: 'affirmation',
    tradition: 'universal',
    title: 'Mistakes help me learn and improve.',
    titleTranslations: {
      hi: 'गलतियाँ मुझे सीखने और सुधरने में मदद करती हैं।',
      pa: 'ਗ਼ਲਤੀਆਂ ਮੈਨੂੰ ਸਿੱਖਣ ਅਤੇ ਸੁਧਰਨ ਵਿੱਚ ਮਦਦ ਕਰਦੀਆਂ ਹਨ।',
    },
  },
  {
    id: 'child-ask-for-help',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I can ask my parents and teachers for help.',
    titleTranslations: {
      hi: 'मैं अपने माता-पिता और शिक्षकों से मदद माँग सकता/सकती हूँ।',
      pa: 'ਮੈਂ ਆਪਣੇ ਮਾਪਿਆਂ ਅਤੇ ਅਧਿਆਪਕਾਂ ਤੋਂ ਮਦਦ ਮੰਗ ਸਕਦਾ/ਸਕਦੀ ਹਾਂ।',
    },
  },
  {
    id: 'child-believe-in-myself',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I believe in myself and my abilities.',
    titleTranslations: {
      hi: 'मुझे खुद पर और अपनी क्षमताओं पर विश्वास है।',
      pa: "ਮੈਨੂੰ ਆਪਣੇ ਆਪ ਅਤੇ ਆਪਣੀਆਂ ਯੋਗਤਾਵਾਂ 'ਤੇ ਭਰੋਸਾ ਹੈ।",
    },
  },
  {
    id: 'child-brave-peaceful-confident',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I am brave, peaceful and confident.',
    titleTranslations: {
      hi: 'मैं बहादुर, शांत और आत्मविश्वासी हूँ।',
      pa: 'ਮੈਂ ਬਹਾਦਰ, ਸ਼ਾਂਤ ਅਤੇ ਭਰੋਸੇਮੰਦ ਹਾਂ।',
    },
  },
  {
    id: 'child-no-comparison',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I do not need to compare myself with others.',
    titleTranslations: {
      hi: 'मुझे खुद की तुलना दूसरों से करने की ज़रूरत नहीं है।',
      pa: 'ਮੈਨੂੰ ਆਪਣੇ ਆਪ ਦੀ ਤੁਲਨਾ ਦੂਜਿਆਂ ਨਾਲ ਕਰਨ ਦੀ ਲੋੜ ਨਹੀਂ ਹੈ।',
    },
  },
  {
    id: 'child-own-pace',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I learn at my own pace.',
    titleTranslations: {
      hi: 'मैं अपनी गति से सीखता/सीखती हूँ।',
      pa: 'ਮੈਂ ਆਪਣੀ ਰਫ਼ਤਾਰ ਨਾਲ ਸਿੱਖਦਾ/ਸਿੱਖਦੀ ਹਾਂ।',
    },
  },
  {
    id: 'child-proud-of-effort',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I am proud of every honest effort I make.',
    titleTranslations: {
      hi: 'मुझे अपने हर ईमानदार प्रयास पर गर्व है।',
      pa: "ਮੈਨੂੰ ਆਪਣੀ ਹਰ ਇਮਾਨਦਾਰ ਕੋਸ਼ਿਸ਼ 'ਤੇ ਮਾਣ ਹੈ।",
    },
  },
  {
    id: 'child-balance-study-play-rest',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I balance studying, playing and resting.',
    titleTranslations: {
      hi: 'मैं पढ़ाई, खेल और आराम में संतुलन बनाता/बनाती हूँ।',
      pa: 'ਮੈਂ ਪੜ੍ਹਾਈ, ਖੇਡ ਅਤੇ ਆਰਾਮ ਵਿੱਚ ਸੰਤੁਲਨ ਬਣਾਉਂਦਾ/ਬਣਾਉਂਦੀ ਹਾਂ।',
    },
  },
  {
    id: 'child-family-loves-regardless',
    category: 'affirmation',
    tradition: 'universal',
    title: 'My family loves me regardless of my marks.',
    titleTranslations: {
      hi: 'मेरे अंकों के बावजूद मेरा परिवार मुझसे प्यार करता है।',
      pa: 'ਮੇਰੇ ਨੰਬਰਾਂ ਦੇ ਬਾਵਜੂਦ ਮੇਰਾ ਪਰਿਵਾਰ ਮੈਨੂੰ ਪਿਆਰ ਕਰਦਾ ਹੈ।',
    },
  },
  {
    id: 'child-learning-something-new',
    category: 'affirmation',
    tradition: 'universal',
    title: 'Every day, I am learning something new.',
    titleTranslations: {
      hi: 'हर दिन, मैं कुछ नया सीख रहा/रही हूँ।',
      pa: 'ਹਰ ਦਿਨ, ਮੈਂ ਕੁਝ ਨਵਾਂ ਸਿੱਖ ਰਿਹਾ/ਰਹੀ ਹਾਂ।',
    },
  },
  {
    id: 'child-exam-specific',
    category: 'affirmation',
    tradition: 'universal',
    title: 'I prepare calmly, give my best and accept my results with confidence.',
    titleTranslations: {
      hi: 'मैं शांति से तैयारी करता/करती हूँ, अपना सर्वश्रेष्ठ देता/देती हूँ और आत्मविश्वास के साथ अपने परिणाम स्वीकार करता/करती हूँ।',
      pa: 'ਮੈਂ ਸ਼ਾਂਤੀ ਨਾਲ ਤਿਆਰੀ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ, ਆਪਣੀ ਪੂਰੀ ਕੋਸ਼ਿਸ਼ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ ਅਤੇ ਭਰੋਸੇ ਨਾਲ ਆਪਣੇ ਨਤੀਜੇ ਸਵੀਕਾਰ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।',
    },
  },
];
