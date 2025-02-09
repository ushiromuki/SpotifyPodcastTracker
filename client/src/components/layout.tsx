import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import { LogOut } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const handleLogout = async () => {
    await logout();
  };

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
                <Link href="/podcasts">
                  <a className="text-sm font-medium hover:text-primary">Podcasts</a>
                </Link>
                <Link href="/stats">
                  <a className="text-sm font-medium hover:text-primary">Statistics</a>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-sm font-medium text-muted-foreground hover:text-primary"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  ログアウト
                </Button>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main>{children}</main>
    </div>
  );
}