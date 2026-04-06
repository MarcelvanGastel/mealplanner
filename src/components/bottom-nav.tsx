"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Tag,
  BookOpen,
  ShoppingCart,
  User,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/context";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  if (pathname?.startsWith("/auth") || pathname?.startsWith("/onboarding")) return null;

  const links = [
    { href: "/planner", label: t.navPlanner, icon: CalendarDays },
    { href: "/deals", label: t.navDeals, icon: Tag },
    { href: "/feed", label: t.navRecipes, icon: BookOpen },
    { href: "/shopping", label: t.navList, icon: ShoppingCart },
    { href: "/profile", label: t.navProfile, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="max-w-lg mx-auto flex justify-around">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 py-3 px-2 text-xs transition-colors ${
                active
                  ? "text-primary font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
