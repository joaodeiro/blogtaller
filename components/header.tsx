"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Moon, Search, SunMedium } from "lucide-react";

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "INÍCIO", href: "/" },
  { label: "ASSUNTOS", href: "/assuntos" },
  { label: "ESPECIAIS", href: "/especiais" },
  { label: "TRABALHE NA TALLER", href: "/trabalhe-na-taller" },
  { label: "SITE DA TALLER", href: "https://taller.net.br", external: true },
];

type Theme = "light" | "dark";

function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem("theme") as Theme | null;
    const initial: Theme = stored ?? "dark";

    document.documentElement.classList.toggle("dark", initial === "dark");
    setTheme(initial);
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        document.documentElement.classList.toggle("dark", next === "dark");
        window.localStorage.setItem("theme", next);
      }
      return next;
    });
  };

  return { theme, toggle };
}

export function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 text-foreground backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-8 w-[82px]">
            <Image
              src={theme === "dark" ? "/logo-taller-dark.svg" : "/logo-taller-light.svg"}
              alt="Taller"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <span className="sr-only">Taller</span>
        </Link>

        <nav className="hidden items-center gap-4 xl:flex">
          {NAV_ITEMS.map((item) => (
            <Button
              key={item.label}
              asChild
              variant="ghost"
              className="px-3 text-sm font-geist text-foreground hover:text-primary"
            >
              <Link
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noreferrer" : undefined}
              >
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="flex items-center gap-3 xl:gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Buscar"
            className="hidden border border-foreground/15 text-foreground hover:border-primary hover:text-primary xl:inline-flex"
          >
            <Search className="size-5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Alternar tema"
            className="hidden border border-foreground/15 text-foreground hover:border-primary hover:text-primary xl:inline-flex"
            onClick={toggle}
          >
            {theme === "dark" ? (
              <SunMedium className="size-5" />
            ) : (
              <Moon className="size-5" />
            )}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="border-foreground/20 text-foreground hover:border-primary hover:text-primary xl:hidden"
              >
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-card border-l border-border" showCloseButton={false}>
              <SheetHeader className="flex flex-row items-center justify-between border-b border-border pb-4">
                <SheetTitle className="font-geist text-sm uppercase tracking-widest text-muted-foreground">
                  Navegação
                </SheetTitle>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Alternar tema"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={toggle}
                  >
                    {theme === "dark" ? (
                      <SunMedium className="size-4" />
                    ) : (
                      <Moon className="size-4" />
                    )}
                  </Button>
                  <SheetClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Fechar menu"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-4" />
                    </Button>
                  </SheetClose>
                </div>
              </SheetHeader>
              <div className="flex flex-col gap-3 px-2 pt-2">
                {NAV_ITEMS.map((item) => (
                  <Button
                    key={item.label}
                    asChild
                    variant="ghost"
                    className="justify-start px-2 font-geist text-base text-foreground hover:text-primary"
                  >
                    <Link
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noreferrer" : undefined}
                    >
                      {item.label}
                    </Link>
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

