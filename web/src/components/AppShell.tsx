import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <h1>AI content creator</h1>
        </div>
      </header>
      {children}
    </main>
  );
}
