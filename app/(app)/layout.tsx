import { requireUser } from "@/lib/auth/dal";
import { Navbar } from "@/components/layout/navbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // The real authorization boundary for every /dashboard, /forum, /admin
  // route — proxy.ts only optimistically redirects to avoid a flash of
  // protected content; this is what actually enforces it.
  const user = await requireUser();

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <Navbar user={{ email: user.email, role: user.role }} />
      <main id="main-content" className="min-h-[calc(100svh-56px)]">
        {children}
      </main>
    </>
  );
}
