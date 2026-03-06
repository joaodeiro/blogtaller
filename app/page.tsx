import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArticleCard } from "@/components/article-card";
import { getPosts, urlFor } from "@/lib/sanity";

export const revalidate = 60; // ISR: revalida a cada 60 segundos

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function Home() {
  const posts = await getPosts().catch(() => []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <section className="space-y-2">
          <p
            className="inline-block bg-clip-text text-xs uppercase tracking-[0.18em] text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, #DA2037 0%, #F56F10 50%, #F9C972 100%)",
              fontFamily: '"Press Start 2P", system-ui, sans-serif',
            }}
          >
            BLOG TALLER
          </p>
          <h1 className="font-geist text-3xl font-semibold text-foreground md:text-4xl">
            Conteúdos sobre gestão, cultura ágil, desenvolvimento de software, design e muito mais.
          </h1>
        </section>

        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post: any) => (
            <ArticleCard
              key={post._id}
              slug={post.slug}
              title={post.title}
              author={post.author}
              date={formatDate(post.publishedAt)}
              tags={post.tags ?? []}
              imageUrl={
                post.coverImage
                  ? urlFor(post.coverImage).width(800).height(500).url()
                  : "https://images.pexels.com/photos/2706379/pexels-photo-2706379.jpeg"
              }
            />
          ))}
        </section>
      </main>
      <Footer />
    </div>
  );
}
