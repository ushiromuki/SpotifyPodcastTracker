import { Link, useLocation } from "wouter";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {location !== "/login" && (
        <nav className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Link href="/">
                  <a className="text-2xl font-bold">Podcast Stats</a>
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/stats">
                  <a className="text-sm font-medium hover:text-primary">Statistics</a>
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main>{children}</main>
    </div>
  );
}
