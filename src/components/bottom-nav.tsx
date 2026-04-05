"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Camera,
  Tag,
  BookOpen,
  PieChart,
} from "lucide-react";

const links = [
  { href: "/planner", label: "Planner", icon: CalendarDays },
  { href: "/scanner", label: "Scanner", icon: Camera },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/feed", label: "Recepten", icon: BookOpen },
  { href: "/nutrition", label: "Voeding", icon: PieChart },
];

export function BottomNav() {
  const pathname = usePathname();

  if (pathname?.startsWith("/auth")) return null;

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
