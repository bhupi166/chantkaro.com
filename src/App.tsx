import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { useAppData } from '@/state/AppDataContext';
import { useTheme } from '@/hooks/useTheme';
import { HomePage } from '@/pages/HomePage';

const ChooseActivityPage = lazy(() =>
  import('@/pages/ChooseActivityPage').then((m) => ({ default: m.ChooseActivityPage })),
);
const ChantSelectPage = lazy(() =>
  import('@/pages/ChantSelectPage').then((m) => ({ default: m.ChantSelectPage })),
);
const AffirmationSelectPage = lazy(() =>
  import('@/pages/AffirmationSelectPage').then((m) => ({ default: m.AffirmationSelectPage })),
);
const ChildrenAffirmationsPage = lazy(() =>
  import('@/pages/ChildrenAffirmationsPage').then((m) => ({ default: m.ChildrenAffirmationsPage })),
);
const ParentsAffirmationsPage = lazy(() =>
  import('@/pages/ParentsAffirmationsPage').then((m) => ({ default: m.ParentsAffirmationsPage })),
);
const ProfessionalAffirmationsPage = lazy(() =>
  import('@/pages/ProfessionalAffirmationsPage').then((m) => ({
    default: m.ProfessionalAffirmationsPage,
  })),
);
const PracticePage = lazy(() =>
  import('@/pages/PracticePage').then((m) => ({ default: m.PracticePage })),
);
const StatsPage = lazy(() => import('@/pages/StatsPage').then((m) => ({ default: m.StatsPage })));
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const PrivacyPage = lazy(() =>
  import('@/pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })),
);
const TermsPage = lazy(() => import('@/pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const BenefitsPage = lazy(() =>
  import('@/pages/BenefitsPage').then((m) => ({ default: m.BenefitsPage })),
);
const ContactPage = lazy(() =>
  import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function PageFallback() {
  return (
    <div className="flex justify-center py-16" role="status" aria-label="Loading">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--accent)] border-t-transparent" />
    </div>
  );
}

export default function App() {
  const { activeProfile } = useAppData();
  useTheme(activeProfile.theme);

  return (
    <Layout>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/choose" element={<ChooseActivityPage />} />
          <Route path="/chant" element={<ChantSelectPage />} />
          <Route path="/affirmation" element={<AffirmationSelectPage />} />
          <Route path="/affirmation/children" element={<ChildrenAffirmationsPage />} />
          <Route path="/affirmation/parents" element={<ParentsAffirmationsPage />} />
          <Route path="/affirmation/professional" element={<ProfessionalAffirmationsPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/benefits" element={<BenefitsPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
