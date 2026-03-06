import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-background/95 text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 text-sm md:flex-row md:items-center">
          <p className="font-geist-mono text-muted-foreground">
            © 2026 Taller. Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="#"
              className="font-geist-mono text-foreground hover:text-primary"
            >
              LinkedIn
            </Link>
            <Link
              href="#"
              className="font-geist-mono text-foreground hover:text-primary"
            >
              Instagram
            </Link>
            <Link
              href="#"
              className="font-geist-mono text-foreground hover:text-primary"
            >
              YouTube
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

