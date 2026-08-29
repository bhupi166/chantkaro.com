import type { PracticeOption } from '@/lib/types';

export interface ProfessionCategory {
  key: string;
  label: string;
}

/**
 * Ordered to match the profession picker shown after "Work & Professional
 * Affirmations". "Other Profession" and "Write My Own Affirmation" always
 * resolve to an empty suggestion list — see PROFESSIONAL_AFFIRMATIONS.
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
 */
export const PROFESSIONAL_AFFIRMATIONS: Record<string, PracticeOption[]> = {
  teacher: [
    {
      id: 'prof-teacher-patience-clarity',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I teach with patience, clarity and compassion.',
    },
    {
      id: 'prof-teacher-different-learning',
      category: 'affirmation',
      tradition: 'universal',
      title: 'Every student has a different way of learning.',
    },
    {
      id: 'prof-teacher-encourage-questions',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I encourage questions, curiosity and independent thinking.',
    },
    {
      id: 'prof-teacher-continue-learning',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I continue learning while helping my students learn.',
    },
    {
      id: 'prof-teacher-positive-difference',
      category: 'affirmation',
      tradition: 'universal',
      title: 'My guidance can make a positive difference.',
    },
  ],
  'it-professional': [
    {
      id: 'prof-it-calm-logical',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I approach technical problems calmly and logically.',
    },
    {
      id: 'prof-it-continue-learning',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I continue learning as technology evolves.',
    },
    {
      id: 'prof-it-communicate-clearly',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I communicate clearly with my team.',
    },
    {
      id: 'prof-it-ask-for-help',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I can ask for help when I need it.',
    },
    {
      id: 'prof-it-balance-rest',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I balance productivity with rest and personal well-being.',
    },
  ],
  'trader-investor': [
    {
      id: 'prof-trader-follow-plan',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I follow my trading plan with patience and discipline.',
    },
    {
      id: 'prof-trader-analysis-not-emotion',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I make decisions based on analysis, not emotion.',
    },
    {
      id: 'prof-trader-protect-capital',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I protect my capital through responsible risk management.',
    },
    {
      id: 'prof-trader-losses-are-part',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I accept that losses are part of trading.',
    },
    {
      id: 'prof-trader-learn-objectively',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I learn objectively from every trade.',
    },
  ],
  'business-owner': [
    {
      id: 'prof-biz-thoughtful-decisions',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I make thoughtful decisions for my business.',
    },
    {
      id: 'prof-biz-genuine-value',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I create genuine value for my customers.',
    },
    {
      id: 'prof-biz-learn-adapt',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I learn from challenges and adapt responsibly.',
    },
    {
      id: 'prof-biz-respect',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I treat my team, customers and partners with respect.',
    },
    {
      id: 'prof-biz-patience-integrity',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I build my business with patience and integrity.',
    },
  ],
  freelancer: [
    {
      id: 'prof-freelance-value',
      category: 'affirmation',
      tradition: 'universal',
      title: 'My skills and time have value.',
    },
    {
      id: 'prof-freelance-expectations',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I communicate my expectations clearly.',
    },
    {
      id: 'prof-freelance-manage-deadlines',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I manage my work and deadlines responsibly.',
    },
    {
      id: 'prof-freelance-improve',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I continue improving my professional abilities.',
    },
    {
      id: 'prof-freelance-respectful-opportunities',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I choose opportunities that respect my work.',
    },
  ],
  healthcare: [
    {
      id: 'prof-health-compassion',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I serve people with compassion and professionalism.',
    },
    {
      id: 'prof-health-listen-first',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I listen carefully before responding.',
    },
    {
      id: 'prof-health-calm-challenging',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I remain calm during challenging situations.',
    },
    {
      id: 'prof-health-strengthen-knowledge',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I continue strengthening my knowledge and skills.',
    },
    {
      id: 'prof-health-own-wellbeing',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I also make time to care for my own well-being.',
    },
  ],
  farmer: [
    {
      id: 'prof-farmer-respect-land',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I respect the land and work with patience.',
    },
    {
      id: 'prof-farmer-thoughtful-decisions',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I make thoughtful decisions using knowledge and experience.',
    },
    {
      id: 'prof-farmer-adapt-courage',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I adapt to changing conditions with courage.',
    },
    {
      id: 'prof-farmer-contribute-society',
      category: 'affirmation',
      tradition: 'universal',
      title: 'My work contributes meaningfully to society.',
    },
    {
      id: 'prof-farmer-sustainable-practices',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I continue learning better and more sustainable practices.',
    },
  ],
  'job-seeker': [
    {
      id: 'prof-jobseeker-improving-skills',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I am improving my skills and preparing for new opportunities.',
    },
    {
      id: 'prof-jobseeker-rejection',
      category: 'affirmation',
      tradition: 'universal',
      title: 'A rejection does not define my ability.',
    },
    {
      id: 'prof-jobseeker-honest-confident',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I present my experience with honesty and confidence.',
    },
    {
      id: 'prof-jobseeker-patient-consistent',
      category: 'affirmation',
      tradition: 'universal',
      title: 'I remain patient and consistent in my search.',
    },
    {
      id: 'prof-jobseeker-right-opportunity',
      category: 'affirmation',
      tradition: 'universal',
      title: 'The right opportunity can take time to arrive.',
    },
  ],
};
