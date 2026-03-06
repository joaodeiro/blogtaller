import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { ArrowLeft } from "lucide-react";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { getPost, getPosts, urlFor } from "@/lib/sanity";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getPosts().catch(() => []);
  return posts.map((post: any) => ({ slug: post.slug }));
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug).catch(() => null);

  if (!post) notFound();

  const coverImageUrl = post.coverImage
    ? urlFor(post.coverImage).width(1200).height(630).url()
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 font-geist-mono text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3" />
          Voltar
        </Link>

        <article>
          <header className="mb-8 space-y-4">
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag: string) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="font-geist-mono text-[11px] uppercase tracking-wide"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <h1 className="font-geist text-3xl font-semibold leading-tight text-foreground md:text-4xl">
              {post.title}
            </h1>

            <p className="font-geist-mono text-sm text-muted-foreground">
              {post.author} · {formatDate(post.publishedAt)}
            </p>
          </header>

          {coverImageUrl && (
            <div className="relative mb-8 h-64 w-full overflow-hidden rounded-lg sm:h-80 lg:h-96">
              <Image
                src={coverImageUrl}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {post.body && (
            <div className="prose prose-neutral dark:prose-invert max-w-none font-geist">
              <PortableText value={post.body} />
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}
