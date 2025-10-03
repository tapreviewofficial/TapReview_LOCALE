import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";

export function Header() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
          <div className="h-8 w-8 rounded bg-gradient-to-br from-gold to-yellow-600"></div>
          <span className="text-xl font-bold text-gold">TapReview</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" data-testid="link-home-nav">
            <Button variant="ghost" className={location === "/" ? "text-gold" : "text-muted-foreground hover:text-foreground"}>
              Home
            </Button>
          </Link>
          <Link href="/login" data-testid="link-login">
            <Button variant="ghost">Accedi</Button>
          </Link>
          <Link href="/register" data-testid="link-register">
            <Button className="btn-gold">Attiva ora</Button>
          </Link>
        </nav>
        <Button variant="ghost" className="md:hidden" data-testid="button-mobile-menu">
          <i className="fas fa-bars text-xl"></i>
        </Button>
      </div>
    </header>
  );
}
