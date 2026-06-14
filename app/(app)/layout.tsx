import { AppShell } from "@/components/AppShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OnboardingTour } from "@/components/OnboardingTour";
import { AuthProvider } from "@/lib/auth-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShell>
        <OnboardingTour />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </AppShell>
    </AuthProvider>
  );
}
