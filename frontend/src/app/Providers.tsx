import type { PropsWithChildren } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../auth";
import { LanguageProvider } from "../i18n";
import { AppErrorBoundary } from "../shared/components/AppErrorBoundary";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
