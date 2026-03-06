import Link from "next/link";
import Image from "next/image";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ArticleCardProps = {
  imageUrl: string;
  title: string;
  author: string;
  date: string;
  tags: string[];
  slug: string;
};

export function ArticleCard({
  imageUrl,
  title,
  author,
  date,
  tags,
  slug,
}: ArticleCardProps) {
  return (
    <Link href={`/posts/${slug}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden rounded-lg gap-0 p-0 shadow-md transition-all duration-300 hover:shadow-lg hover:border-primary/40">
        <div className="relative h-40 sm:h-48 w-full shrink-0 overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="rounded-t-lg object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <h3 className="font-geist text-lg sm:text-xl font-semibold leading-tight text-foreground transition-colors duration-200 group-hover:text-primary">
            {title}
          </h3>
          <p className="font-geist-mono text-xs text-muted-foreground">
            {author} · {date}
          </p>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
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
        </div>
      </Card>
    </Link>
  );
}

