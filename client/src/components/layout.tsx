import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Menu, Home, Film, Users, LogOut } from "lucide-react";
import { Link } from "wouter";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logoutMutation } = useAuth();

  const menuItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/watchlist", icon: Film, label: "Meine Watchlist" },
    ...(user?.role === "admin"
      ? [{ href: "/admin/users", icon: Users, label: "Benutzerverwaltung" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Menu */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>CinemaScope</SheetTitle>
                </SheetHeader>
                <nav className="mt-8">
                  <ul className="space-y-2">
                    {menuItems.map((item) => (
                      <li key={item.href}>
                        <Link href={item.href}>
                          <Button variant="ghost" className="w-full justify-start gap-2">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </Button>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>

            {/* Desktop Logo */}
            <Link href="/">
              <h1 className="text-xl font-bold">CinemaScope</h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-4 ml-8">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button variant="ghost" className="gap-2">
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          {/* Auth Button */}
          {user ? (
            <Button 
              variant="ghost"
              className="gap-2"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-4 w-4" />
              Abmelden
            </Button>
          ) : (
            <Link href="/auth">
              <Button variant="default">Anmelden</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}