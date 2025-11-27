/**
 * Navigation Component
 *
 * Based on spec 31_1_auth-spec.md section 2.2.2
 *
 * Features:
 * - Responsive navigation (desktop horizontal menu, mobile hamburger)
 * - Logout button for authenticated users
 * - Login/Register buttons for guests
 * - Loading state during logout
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface NavigationProps {
  user: {
    id: string;
    email: string;
  } | null;
}

export default function Navigation({ user }: NavigationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);

    try {
      // Call server-side logout API endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // Server returned error
        const errorMessage = data.error || "Nie udaBo si wylogowa";
        toast.error(errorMessage);
        setIsLoading(false);
        return;
      }

      // Success - session cleared on server
      toast.success("ZostaBe[ wylogowany");

      // Redirect to login page
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Brak poBczenia. Sprawdz internet i spróbuj ponownie.");
      setIsLoading(false);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a
            href={user ? "/dashboard" : "/"}
            className="text-2xl font-bold text-primary hover:opacity-80 transition-opacity"
          >
            ShopMate
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                {/* Authenticated user menu */}
                <a
                  href="/dashboard"
                  className="text-gray-700 hover:text-primary transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/recipes"
                  className="text-gray-700 hover:text-primary transition-colors"
                >
                  Przepisy
                </a>
                <a
                  href="/calendar"
                  className="text-gray-700 hover:text-primary transition-colors"
                >
                  Kalendarz
                </a>
                <a
                  href="/shopping-lists"
                  className="text-gray-700 hover:text-primary transition-colors"
                >
                  Listy zakupów
                </a>

                {/* Logout button */}
                <Button onClick={handleLogout} variant="outline" disabled={isLoading}>
                  {isLoading ? "Wylogowuj..." : "Wyloguj"}
                </Button>
              </>
            ) : (
              <>
                {/* Guest menu */}
                <a href="/login">
                  <Button variant="outline">Zaloguj si</Button>
                </a>
                <a href="/register">
                  <Button>Zarejestruj si</Button>
                </a>
              </>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            {user ? (
              <div className="flex flex-col space-y-3">
                <a
                  href="/dashboard"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Dashboard
                </a>
                <a
                  href="/recipes"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Przepisy
                </a>
                <a
                  href="/calendar"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Kalendarz
                </a>
                <a
                  href="/shopping-lists"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  Listy zakupów
                </a>
                <div className="px-4 pt-2">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Wylogowuj..." : "Wyloguj"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-3 px-4">
                <a href="/login" className="w-full">
                  <Button variant="outline" className="w-full">
                    Zaloguj si
                  </Button>
                </a>
                <a href="/register" className="w-full">
                  <Button className="w-full">Zarejestruj si</Button>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}