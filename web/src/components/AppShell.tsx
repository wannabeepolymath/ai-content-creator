import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <h1>MAGI</h1>
          <p className="app-subtitle">AI Content Creator</p>
        </div>
      </header>
      {children}
    </main>
  );
}
