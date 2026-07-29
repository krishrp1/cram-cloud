"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";

type NavUser = {
  email: string;
  role: string;
};

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/forum", label: "Forum" },
];

export function Navbar({ user }: { user: NavUser }) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="text-cta size-5" aria-hidden />
        <span className="font-heading text-base font-semibold">Cram Cloud</span>
      </div>

      <div className="flex items-center gap-1">
        {LINKS.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          );
        })}
        {user.role === "admin" && (
          <Link
            href="/admin"
            aria-current={pathname.startsWith("/admin") ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            Admin
          </Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:inline">{user.email}</span>
        <Badge variant="secondary" className="uppercase">
          {user.role}
        </Badge>
        <ThemeToggle />
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Logout
          </Button>
        </form>
      </div>
    </nav>
  );
}
