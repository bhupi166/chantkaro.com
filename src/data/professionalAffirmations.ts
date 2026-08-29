import type { PracticeOption } from '@/lib/types';

export interface ProfessionCategory {
  key: string;
  label: string;
}

/**
 * Ordered to match the profession picker shown after "Career Growth &
 * Success". "Other Profession" and "Write My Own Affirmation" always
 * resolve to an empty suggestion list — see PROFESSIONAL_AFFIRMATIONS.
 * Category labels are translated via i18next (professional.categories.*);
 * `label` here is only the English fallback passed to t() as a default.
 */
export const PROFESSION_CATEGORIES: ProfessionCategory[] = [
  { key: 'teacher', label: 'Teacher' },
  { key: 'it-professional', label: 'IT Professional' },
  { key: 'trader-investor', label: 'Trader or Investor' },
  { key: 'business-owner', label: 'Business Owner or Entrepreneur' },
  { key: 'freelancer', label: 'Freelancer' },
  { key: 'healthcare', label: 'Healthcare Professional' },
  { key: 'government-employee', label: 'Government Employee' },
  { key: 'sales', label: 'Sales Professional' },
  { key: 'customer-service', label: 'Customer-Service Professional' },
  { key: 'farmer', label: 'Farmer' },
  { key: 'creative', label: 'Creative Professional' },
  { key: 'homemaker', label: 'Homemaker' },
  { key: 'job-seeker', label: 'Job Seeker' },
  { key: 'other', label: 'Other Profession' },
  { key: 'write-own', label: 'Write My Own Affirmation' },
];

/**
 * Suggested affirmations per profession. A profession with no entries here
 * (Government Employee, Sales, Customer-Service, Creative, Homemaker,
 * Other, Write My Own) intentionally shows no suggestions yet — only the
 * custom-entry box — rather than guessing at content for a role we don't
 * have reviewed wording for. Add a reviewed array here, keyed by the same
 * `key` as PROFESSION_CATEGORIES, whenever one becomes available.
 *
 * See childrenAffirmations.ts for the translation-quality note that
 * applies to every `titleTranslations` entry in this file too.
 */
export const PROFESSIONAL_AFFIRMATIONS: Record<string, PracticeOption[]> = {
  teacher: [
    {
      id: 'prof-teacher-patience-clarity',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I teach with patience, clarity and compassion.',
      titleTranslations: {
        hi: 'मैं धैर्य, स्पष्टता और करुणा के साथ पढ़ाता/पढ़ाती हूँ।',
        pa: 'ਮੈਂ ਸਬਰ, ਸਪਸ਼ਟਤਾ ਅਤੇ ਦਇਆ ਨਾਲ ਪੜ੍ਹਾਉਂਦਾ/ਪੜ੍ਹਾਉਂਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-teacher-different-learning',
      category: 'affirmation',
      tradition: 'universal',
      title: 'Every student has a different way of learning.',
      titleTranslations: {
        hi: 'हर विद्यार्थी के सीखने का तरीका अलग होता है।',
        pa: 'ਹਰ ਵਿਦਿਆਰਥੀ ਦੇ ਸਿੱਖਣ ਦਾ ਤਰੀਕਾ ਵੱਖਰਾ ਹੁੰਦਾ ਹੈ।',
      },
    },
    {
      id: 'prof-teacher-encourage-questions',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I encourage questions, curiosity and independent thinking.',
      titleTranslations: {
        hi: 'मैं प्रश्नों, जिज्ञासा और स्वतंत्र सोच को प्रोत्साहित करता/करती हूँ।',
        pa: 'ਮੈਂ ਸਵਾਲਾਂ, ਜਗਿਆਸਾ ਅਤੇ ਸੁਤੰਤਰ ਸੋਚ ਨੂੰ ਉਤਸ਼ਾਹਿਤ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-teacher-continue-learning',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I continue learning while helping my students learn.',
      titleTranslations: {
        hi: 'मैं अपने विद्यार्थियों को सिखाते हुए खुद भी सीखता/सीखती रहता/रहती हूँ।',
        pa: 'ਮੈਂ ਆਪਣੇ ਵਿਦਿਆਰਥੀਆਂ ਦੀ ਮਦਦ ਕਰਦੇ ਹੋਏ ਖੁਦ ਵੀ ਸਿੱਖਦਾ/ਸਿੱਖਦੀ ਰਹਿੰਦਾ/ਰਹਿੰਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-teacher-positive-difference',
      category: 'affirmation',
      tradition: 'universal',
      title: 'My guidance can make a positive difference.',
      titleTranslations: {
        hi: 'मेरा मार्गदर्शन एक सकारात्मक बदलाव ला सकता है।',
        pa: 'ਮੇਰੀ ਅਗਵਾਈ ਇੱਕ ਸਕਾਰਾਤਮਕ ਬਦਲਾਅ ਲਿਆ ਸਕਦੀ ਹੈ।',
      },
    },
  ],
  'it-professional': [
    {
      id: 'prof-it-calm-logical',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I approach technical problems calmly and logically.',
      titleTranslations: {
        hi: 'मैं तकनीकी समस्याओं का सामना शांति और तर्कसंगत तरीके से करता/करती हूँ।',
        pa: 'ਮੈਂ ਤਕਨੀਕੀ ਸਮੱਸਿਆਵਾਂ ਦਾ ਸਾਹਮਣਾ ਸ਼ਾਂਤੀ ਅਤੇ ਤਰਕਪੂਰਨ ਢੰਗ ਨਾਲ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-it-continue-learning',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I continue learning as technology evolves.',
      titleTranslations: {
        hi: 'जैसे-जैसे तकनीक बदलती है, मैं सीखना जारी रखता/रखती हूँ।',
        pa: 'ਜਿਵੇਂ-ਜਿਵੇਂ ਤਕਨਾਲੋਜੀ ਬਦਲਦੀ ਹੈ, ਮੈਂ ਸਿੱਖਣਾ ਜਾਰੀ ਰੱਖਦਾ/ਰੱਖਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-it-communicate-clearly',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I communicate clearly with my team.',
      titleTranslations: {
        hi: 'मैं अपनी टीम के साथ स्पष्ट रूप से संवाद करता/करती हूँ।',
        pa: "ਮੈਂ ਆਪਣੀ ਟੀਮ ਨਾਲ ਸਪਸ਼ਟ ਤੌਰ 'ਤੇ ਗੱਲਬਾਤ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।",
      },
    },
    {
      id: 'prof-it-ask-for-help',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I can ask for help when I need it.',
      titleTranslations: {
        hi: 'जब मुझे ज़रूरत हो, मैं मदद माँग सकता/सकती हूँ।',
        pa: 'ਜਦੋਂ ਮੈਨੂੰ ਲੋੜ ਹੋਵੇ, ਮੈਂ ਮਦਦ ਮੰਗ ਸਕਦਾ/ਸਕਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-it-balance-rest',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I balance productivity with rest and personal well-being.',
      titleTranslations: {
        hi: 'मैं उत्पादकता को आराम और व्यक्तिगत भलाई के साथ संतुलित करता/करती हूँ।',
        pa: 'ਮੈਂ ਉਤਪਾਦਕਤਾ ਨੂੰ ਆਰਾਮ ਅਤੇ ਨਿੱਜੀ ਭਲਾਈ ਨਾਲ ਸੰਤੁਲਿਤ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।',
      },
    },
  ],
  'trader-investor': [
    {
      id: 'prof-trader-follow-plan',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I follow my trading plan with patience and discipline.',
      titleTranslations: {
        hi: 'मैं धैर्य और अनुशासन के साथ अपनी ट्रेडिंग योजना का पालन करता/करती हूँ।',
        pa: 'ਮੈਂ ਸਬਰ ਅਤੇ ਅਨੁਸ਼ਾਸਨ ਨਾਲ ਆਪਣੀ ਟ੍ਰੇਡਿੰਗ ਯੋਜਨਾ ਦੀ ਪਾਲਣਾ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-trader-analysis-not-emotion',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I make decisions based on analysis, not emotion.',
      titleTranslations: {
        hi: 'मैं भावना नहीं, विश्लेषण के आधार पर निर्णय लेता/लेती हूँ।',
        pa: "ਮੈਂ ਭਾਵਨਾ ਨਹੀਂ, ਵਿਸ਼ਲੇਸ਼ਣ ਦੇ ਆਧਾਰ 'ਤੇ ਫੈਸਲੇ ਲੈਂਦਾ/ਲੈਂਦੀ ਹਾਂ।",
      },
    },
    {
      id: 'prof-trader-protect-capital',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I protect my capital through responsible risk management.',
      titleTranslations: {
        hi: 'मैं जिम्मेदार जोखिम प्रबंधन के माध्यम से अपनी पूँजी की रक्षा करता/करती हूँ।',
        pa: 'ਮੈਂ ਜ਼ਿੰਮੇਵਾਰ ਜੋਖਮ ਪ੍ਰਬੰਧਨ ਰਾਹੀਂ ਆਪਣੀ ਪੂੰਜੀ ਦੀ ਰੱਖਿਆ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-trader-losses-are-part',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I accept that losses are part of trading.',
      titleTranslations: {
        hi: 'मैं स्वीकार करता/करती हूँ कि नुकसान ट्रेडिंग का एक हिस्सा है।',
        pa: 'ਮੈਂ ਸਵੀਕਾਰ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ ਕਿ ਨੁਕਸਾਨ ਟ੍ਰੇਡਿੰਗ ਦਾ ਹਿੱਸਾ ਹੈ।',
      },
    },
    {
      id: 'prof-trader-learn-objectively',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I learn objectively from every trade.',
      titleTranslations: {
        hi: 'मैं हर ट्रेड से निष्पक्ष रूप से सीखता/सीखती हूँ।',
        pa: 'ਮੈਂ ਹਰ ਟ੍ਰੇਡ ਤੋਂ ਨਿਰਪੱਖ ਢੰਗ ਨਾਲ ਸਿੱਖਦਾ/ਸਿੱਖਦੀ ਹਾਂ।',
      },
    },
  ],
  'business-owner': [
    {
      id: 'prof-biz-thoughtful-decisions',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I make thoughtful decisions for my business.',
      titleTranslations: {
        hi: 'मैं अपने व्यवसाय के लिए सोच-समझकर निर्णय लेता/लेती हूँ।',
        pa: 'ਮੈਂ ਆਪਣੇ ਕਾਰੋਬਾਰ ਲਈ ਸੋਚ-ਸਮਝ ਕੇ ਫੈਸਲੇ ਲੈਂਦਾ/ਲੈਂਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-biz-genuine-value',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I create genuine value for my customers.',
      titleTranslations: {
        hi: 'मैं अपने ग्राहकों के लिए वास्तविक मूल्य बनाता/बनाती हूँ।',
        pa: 'ਮੈਂ ਆਪਣੇ ਗਾਹਕਾਂ ਲਈ ਅਸਲੀ ਮੁੱਲ ਬਣਾਉਂਦਾ/ਬਣਾਉਂਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-biz-learn-adapt',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I learn from challenges and adapt responsibly.',
      titleTranslations: {
        hi: 'मैं चुनौतियों से सीखता/सीखती हूँ और जिम्मेदारी से खुद को ढालता/ढालती हूँ।',
        pa: 'ਮੈਂ ਚੁਣੌਤੀਆਂ ਤੋਂ ਸਿੱਖਦਾ/ਸਿੱਖਦੀ ਹਾਂ ਅਤੇ ਜ਼ਿੰਮੇਵਾਰੀ ਨਾਲ ਖੁਦ ਨੂੰ ਢਾਲਦਾ/ਢਾਲਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-biz-respect',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I treat my team, customers and partners with respect.',
      titleTranslations: {
        hi: 'मैं अपनी टीम, ग्राहकों और साझेदारों के साथ सम्मान से पेश आता/आती हूँ।',
        pa: 'ਮੈਂ ਆਪਣੀ ਟੀਮ, ਗਾਹਕਾਂ ਅਤੇ ਭਾਈਵਾਲਾਂ ਨਾਲ ਸਤਿਕਾਰ ਨਾਲ ਪੇਸ਼ ਆਉਂਦਾ/ਆਉਂਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-biz-patience-integrity',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I build my business with patience and integrity.',
      titleTranslations: {
        hi: 'मैं अपना व्यवसाय धैर्य और ईमानदारी के साथ बनाता/बनाती हूँ।',
        pa: 'ਮੈਂ ਆਪਣਾ ਕਾਰੋਬਾਰ ਸਬਰ ਅਤੇ ਇਮਾਨਦਾਰੀ ਨਾਲ ਬਣਾਉਂਦਾ/ਬਣਾਉਂਦੀ ਹਾਂ।',
      },
    },
  ],
  freelancer: [
    {
      id: 'prof-freelance-value',
      category: 'affirmation',
      tradition: 'universal',
      title: 'My skills and time have value.',
      titleTranslations: {
        hi: 'मेरे कौशल और समय का मूल्य है।',
        pa: 'ਮੇਰੇ ਹੁਨਰ ਅਤੇ ਸਮੇਂ ਦਾ ਮੁੱਲ ਹੈ।',
      },
    },
    {
      id: 'prof-freelance-expectations',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I communicate my expectations clearly.',
      titleTranslations: {
        hi: 'मैं अपनी अपेक्षाओं को स्पष्ट रूप से बताता/बताती हूँ।',
        pa: "ਮੈਂ ਆਪਣੀਆਂ ਉਮੀਦਾਂ ਸਪਸ਼ਟ ਤੌਰ 'ਤੇ ਦੱਸਦਾ/ਦੱਸਦੀ ਹਾਂ।",
      },
    },
    {
      id: 'prof-freelance-manage-deadlines',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I manage my work and deadlines responsibly.',
      titleTranslations: {
        hi: 'मैं अपने काम और समय-सीमाओं को जिम्मेदारी से संभालता/संभालती हूँ।',
        pa: 'ਮੈਂ ਆਪਣੇ ਕੰਮ ਅਤੇ ਸਮਾਂ-ਸੀਮਾਵਾਂ ਨੂੰ ਜ਼ਿੰਮੇਵਾਰੀ ਨਾਲ ਸੰਭਾਲਦਾ/ਸੰਭਾਲਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-freelance-improve',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I continue improving my professional abilities.',
      titleTranslations: {
        hi: 'मैं अपनी पेशेवर क्षमताओं में लगातार सुधार करता/करती हूँ।',
        pa: 'ਮੈਂ ਆਪਣੀਆਂ ਪੇਸ਼ੇਵਰ ਯੋਗਤਾਵਾਂ ਵਿੱਚ ਲਗਾਤਾਰ ਸੁਧਾਰ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-freelance-respectful-opportunities',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I choose opportunities that respect my work.',
      titleTranslations: {
        hi: 'मैं ऐसे अवसर चुनता/चुनती हूँ जो मेरे काम का सम्मान करें।',
        pa: 'ਮੈਂ ਅਜਿਹੇ ਮੌਕੇ ਚੁਣਦਾ/ਚੁਣਦੀ ਹਾਂ ਜੋ ਮੇਰੇ ਕੰਮ ਦਾ ਸਤਿਕਾਰ ਕਰਨ।',
      },
    },
  ],
  healthcare: [
    {
      id: 'prof-health-compassion',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I serve people with compassion and professionalism.',
      titleTranslations: {
        hi: 'मैं लोगों की सेवा करुणा और व्यावसायिकता के साथ करता/करती हूँ।',
        pa: 'ਮੈਂ ਲੋਕਾਂ ਦੀ ਸੇਵਾ ਦਇਆ ਅਤੇ ਪੇਸ਼ੇਵਰਤਾ ਨਾਲ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-health-listen-first',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I listen carefully before responding.',
      titleTranslations: {
        hi: 'मैं जवाब देने से पहले ध्यान से सुनता/सुनती हूँ।',
        pa: 'ਮੈਂ ਜਵਾਬ ਦੇਣ ਤੋਂ ਪਹਿਲਾਂ ਧਿਆਨ ਨਾਲ ਸੁਣਦਾ/ਸੁਣਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-health-calm-challenging',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I remain calm during challenging situations.',
      titleTranslations: {
        hi: 'मैं कठिन परिस्थितियों में शांत रहता/रहती हूँ।',
        pa: 'ਮੈਂ ਔਖੇ ਹਾਲਾਤਾਂ ਵਿੱਚ ਸ਼ਾਂਤ ਰਹਿੰਦਾ/ਰਹਿੰਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-health-strengthen-knowledge',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I continue strengthening my knowledge and skills.',
      titleTranslations: {
        hi: 'मैं अपने ज्ञान और कौशल को लगातार मज़बूत करता/करती हूँ।',
        pa: 'ਮੈਂ ਆਪਣੇ ਗਿਆਨ ਅਤੇ ਹੁਨਰ ਨੂੰ ਲਗਾਤਾਰ ਮਜ਼ਬੂਤ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-health-own-wellbeing',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I also make time to care for my own well-being.',
      titleTranslations: {
        hi: 'मैं अपनी भलाई का ध्यान रखने के लिए भी समय निकालता/निकालती हूँ।',
        pa: 'ਮੈਂ ਆਪਣੀ ਭਲਾਈ ਦਾ ਧਿਆਨ ਰੱਖਣ ਲਈ ਵੀ ਸਮਾਂ ਕੱਢਦਾ/ਕੱਢਦੀ ਹਾਂ।',
      },
    },
  ],
  farmer: [
    {
      id: 'prof-farmer-respect-land',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I respect the land and work with patience.',
      titleTranslations: {
        hi: 'मैं भूमि का सम्मान करता/करती हूँ और धैर्य से काम करता/करती हूँ।',
        pa: 'ਮੈਂ ਜ਼ਮੀਨ ਦਾ ਸਤਿਕਾਰ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ ਅਤੇ ਸਬਰ ਨਾਲ ਕੰਮ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-farmer-thoughtful-decisions',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I make thoughtful decisions using knowledge and experience.',
      titleTranslations: {
        hi: 'मैं ज्ञान और अनुभव का उपयोग करके सोच-समझकर निर्णय लेता/लेती हूँ।',
        pa: 'ਮੈਂ ਗਿਆਨ ਅਤੇ ਤਜਰਬੇ ਦੀ ਵਰਤੋਂ ਕਰਕੇ ਸੋਚ-ਸਮਝ ਕੇ ਫੈਸਲੇ ਲੈਂਦਾ/ਲੈਂਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-farmer-adapt-courage',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I adapt to changing conditions with courage.',
      titleTranslations: {
        hi: 'मैं बदलती परिस्थितियों में साहस के साथ खुद को ढालता/ढालती हूँ।',
        pa: 'ਮੈਂ ਬਦਲਦੇ ਹਾਲਾਤਾਂ ਵਿੱਚ ਹਿੰਮਤ ਨਾਲ ਖੁਦ ਨੂੰ ਢਾਲਦਾ/ਢਾਲਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-farmer-contribute-society',
      category: 'affirmation',
      tradition: 'universal',
      title: 'My work contributes meaningfully to society.',
      titleTranslations: {
        hi: 'मेरा काम समाज में सार्थक योगदान देता है।',
        pa: 'ਮੇਰਾ ਕੰਮ ਸਮਾਜ ਵਿੱਚ ਅਰਥਪੂਰਨ ਯੋਗਦਾਨ ਪਾਉਂਦਾ ਹੈ।',
      },
    },
    {
      id: 'prof-farmer-sustainable-practices',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I continue learning better and more sustainable practices.',
      titleTranslations: {
        hi: 'मैं बेहतर और अधिक टिकाऊ तरीके सीखता/सीखती रहता/रहती हूँ।',
        pa: 'ਮੈਂ ਬਿਹਤਰ ਅਤੇ ਵਧੇਰੇ ਟਿਕਾਊ ਤਰੀਕੇ ਸਿੱਖਦਾ/ਸਿੱਖਦੀ ਰਹਿੰਦਾ/ਰਹਿੰਦੀ ਹਾਂ।',
      },
    },
  ],
  'job-seeker': [
    {
      id: 'prof-jobseeker-improving-skills',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I am improving my skills and preparing for new opportunities.',
      titleTranslations: {
        hi: 'मैं अपने कौशल में सुधार कर रहा/रही हूँ और नए अवसरों के लिए तैयारी कर रहा/रही हूँ।',
        pa: 'ਮੈਂ ਆਪਣੇ ਹੁਨਰ ਵਿੱਚ ਸੁਧਾਰ ਕਰ ਰਿਹਾ/ਰਹੀ ਹਾਂ ਅਤੇ ਨਵੇਂ ਮੌਕਿਆਂ ਲਈ ਤਿਆਰੀ ਕਰ ਰਿਹਾ/ਰਹੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-jobseeker-rejection',
      category: 'affirmation',
      tradition: 'universal',
      title: 'A rejection does not define my ability.',
      titleTranslations: {
        hi: 'एक अस्वीकृति मेरी क्षमता को परिभाषित नहीं करती।',
        pa: 'ਇੱਕ ਇਨਕਾਰ ਮੇਰੀ ਯੋਗਤਾ ਨੂੰ ਪਰਿਭਾਸ਼ਿਤ ਨਹੀਂ ਕਰਦਾ।',
      },
    },
    {
      id: 'prof-jobseeker-honest-confident',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I present my experience with honesty and confidence.',
      titleTranslations: {
        hi: 'मैं अपने अनुभव को ईमानदारी और आत्मविश्वास के साथ प्रस्तुत करता/करती हूँ।',
        pa: 'ਮੈਂ ਆਪਣੇ ਤਜਰਬੇ ਨੂੰ ਇਮਾਨਦਾਰੀ ਅਤੇ ਭਰੋਸੇ ਨਾਲ ਪੇਸ਼ ਕਰਦਾ/ਕਰਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-jobseeker-patient-consistent',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I remain patient and consistent in my search.',
      titleTranslations: {
        hi: 'मैं अपनी खोज में धैर्यवान और निरंतर बना/बनी रहता/रहती हूँ।',
        pa: 'ਮੈਂ ਆਪਣੀ ਖੋਜ ਵਿੱਚ ਸਬਰਵਾਨ ਅਤੇ ਲਗਾਤਾਰ ਬਣਿਆ/ਬਣੀ ਰਹਿੰਦਾ/ਰਹਿੰਦੀ ਹਾਂ।',
      },
    },
    {
      id: 'prof-jobseeker-right-opportunity',
      category: 'affirmation',
      tradition: 'universal',
      title: 'The right opportunity can take time to arrive.',
      titleTranslations: {
        hi: 'सही अवसर आने में समय लग सकता है।',
        pa: 'ਸਹੀ ਮੌਕਾ ਆਉਣ ਵਿੱਚ ਸਮਾਂ ਲੱਗ ਸਕਦਾ ਹੈ।',
      },
    },
  ],
};
