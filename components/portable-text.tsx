import { PortableText as PortableTextComponent, PortableTextReactComponents } from "@portabletext/react";

const portableTextComponents: PortableTextReactComponents = {
  block: {
    normal: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
    h1: ({ children }) => <h1 className="text-3xl font-bold mb-6 mt-8">{children}</h1>,
    h2: ({ children }) => <h2 className="text-2xl font-bold mb-5 mt-7">{children}</h2>,
    h3: ({ children }) => <h3 className="text-xl font-bold mb-4 mt-6">{children}</h3>,
    h4: ({ children }) => <h4 className="text-lg font-bold mb-3 mt-5">{children}</h4>,
    h5: ({ children }) => <h5 className="text-base font-bold mb-3 mt-4">{children}</h5>,
    h6: ({ children }) => <h6 className="text-sm font-bold mb-2 mt-3">{children}</h6>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-2">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-2">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="ml-2">{children}</li>,
    number: ({ children }) => <li className="ml-2">{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-bold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-muted px-2 py-1 rounded font-mono text-sm">
        {children}
      </code>
    ),
    link: ({ value, children }) => (
      <a
        href={value?.href}
        target={value?.blank ? "_blank" : undefined}
        rel={value?.blank ? "noopener noreferrer" : undefined}
        className="text-primary hover:underline"
      >
        {children}
      </a>
    ),
  },
};

export function PortableText({ value }: { value: any }) {
  return <PortableTextComponent value={value} components={portableTextComponents} />;
}
