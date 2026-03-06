import { createClient } from "next-sanity";
import https from "https";
import { parseHTML } from "linkedom";

const WORDPRESS_API = "https://blog.taller.net.br/wp-json/wp/v2";
const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
const SANITY_TOKEN = process.env.SANITY_API_TOKEN;

if (!SANITY_TOKEN) {
  console.error("❌ SANITY_API_TOKEN não configurado");
  process.exit(1);
}

const client = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2024-01-01",
  token: SANITY_TOKEN,
  useCdn: false,
});

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Status ${res.statusCode}`));
          }
        });
      })
      .on("error", reject);
  });
}

function decodeHtmlEntities(text) {
  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#039;": "'",
    "&nbsp;": " ",
    "&#8220;": '"',
    "&#8221;": '"',
    "&#8211;": "-",
    "&#8212;": "-",
    "&#8230;": "...",
    "&ldquo;": '"',
    "&rdquo;": '"',
    "&ndash;": "-",
    "&mdash;": "-",
    "&hellip;": "...",
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, "g"), char);
  }

  // Decode numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
}

function htmlToPortableText(htmlContent) {
  if (!htmlContent) return [];

  try {
    const { document } = parseHTML(htmlContent);
    const blocks = [];

    const processNode = (node) => {
      if (node.nodeType === 3) {
        // Text node
        const text = node.textContent.trim();
        if (text) {
          return text;
        }
      } else if (node.nodeType === 1) {
        // Element node
        const tag = node.tagName.toLowerCase();

        if (
          ["p", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"].includes(tag)
        ) {
          const children = Array.from(node.childNodes);
          const text = children.map(processNode).join("");

          if (text.trim()) {
            blocks.push({
              _type: "block",
              style: tag === "blockquote" ? "blockquote" : tag.startsWith("h")
                ? tag
                : "normal",
              _key: Math.random().toString(36),
              markDefs: [],
              children: [
                {
                  _type: "span",
                  marks: [],
                  text: text.trim().substring(0, 2000),
                  _key: Math.random().toString(36),
                },
              ],
            });
          }
        } else if (tag === "ul" || tag === "ol") {
          const items = Array.from(node.querySelectorAll("li"));
          items.forEach((li) => {
            const text = li.textContent.trim();
            if (text) {
              blocks.push({
                _type: "block",
                style: "normal",
                _key: Math.random().toString(36),
                markDefs: [],
                children: [
                  {
                    _type: "span",
                    marks: [],
                    text: `• ${text}`,
                    _key: Math.random().toString(36),
                  },
                ],
              });
            }
          });
        } else if (tag === "img") {
          // Skip images for now - they'll need separate handling
          return "";
        } else {
          // Recursively process children
          const children = Array.from(node.childNodes);
          return children.map(processNode).join("");
        }
      }
      return "";
    };

    Array.from(document.body.childNodes).forEach(processNode);

    return blocks.length > 0
      ? blocks
      : [
          {
            _type: "block",
            style: "normal",
            _key: Math.random().toString(36),
            markDefs: [],
            children: [
              {
                _type: "span",
                marks: [],
                text: htmlContent.replace(/<[^>]*>/g, "").substring(0, 500),
                _key: Math.random().toString(36),
              },
            ],
          },
        ];
  } catch (error) {
    console.error("Error parsing HTML:", error.message);
    return [
      {
        _type: "block",
        style: "normal",
        _key: Math.random().toString(36),
        markDefs: [],
        children: [
          {
            _type: "span",
            marks: [],
            text: htmlContent.replace(/<[^>]*>/g, "").substring(0, 500),
            _key: Math.random().toString(36),
          },
        ],
      },
    ];
  }
}

async function downloadImage(imageUrl) {
  try {
    const buffer = await new Promise((resolve, reject) => {
      https.get(imageUrl, (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      });
    });

    return buffer;
  } catch (error) {
    console.error(`Erro ao baixar imagem ${imageUrl}:`, error.message);
    return null;
  }
}

async function uploadImageToSanity(imageUrl, fileName) {
  try {
    const buffer = await downloadImage(imageUrl);
    if (!buffer) return null;

    const asset = await client.assets.upload("image", buffer, {
      filename: fileName,
    });
    return asset;
  } catch (error) {
    console.error(`Erro ao fazer upload de imagem:`, error.message);
    return null;
  }
}

async function fetchTags(postId) {
  try {
    const tags = await fetchUrl(
      `${WORDPRESS_API}/posts/${postId}?_embed=wp:term`
    );
    if (tags._embedded && tags._embedded["wp:term"]) {
      const tagsList = tags._embedded["wp:term"][1]; // tags are usually at index 1
      return tagsList ? tagsList.map((t) => t.name) : ["geral"];
    }
  } catch (error) {
    console.log(`Erro ao buscar tags do post ${postId}`);
  }
  return ["geral"];
}

async function fetchWordPressPosts() {
  console.log("📥 Buscando posts do WordPress...");
  let allPosts = [];
  let page = 1;

  while (true) {
    const url = `${WORDPRESS_API}/posts?per_page=100&page=${page}`;
    try {
      const posts = await fetchUrl(url);
      if (posts.length === 0) break;
      allPosts = allPosts.concat(posts);
      console.log(`  ✓ Página ${page}: ${posts.length} posts`);
      page++;
    } catch (error) {
      console.error(`Erro na página ${page}:`, error.message);
      break;
    }
  }

  console.log(`✅ Total: ${allPosts.length} posts encontrados\n`);
  return allPosts;
}

async function convertToSanity(wpPosts) {
  console.log("🔄 Convertendo para formato Sanity...");
  const sanityPosts = [];

  for (let i = 0; i < wpPosts.length; i++) {
    const post = wpPosts[i];
    const slug = post.slug;

    // Decode title
    const title = decodeHtmlEntities(post.title.rendered);

    // Decode excerpt
    const excerpt = decodeHtmlEntities(post.excerpt.rendered)
      .replace(/<[^>]*>/g, "")
      .substring(0, 200);

    // Convert content to Portable Text
    const content = post.content.rendered;
    const body = htmlToPortableText(content);

    // Fetch real tags
    const tags = await fetchTags(post.id);

    const sanityPost = {
      _type: "post",
      title: title,
      slug: {
        _type: "slug",
        current: slug,
      },
      author: "Taller",
      publishedAt: post.date,
      excerpt: excerpt,
      tags: tags.slice(0, 5),
      body: body,
    };

    // Handle featured image
    if (post.featured_media) {
      try {
        const media = await fetchUrl(
          `${WORDPRESS_API}/media/${post.featured_media}`
        );
        if (media.source_url) {
          console.log(`  ↳ Baixando imagem de ${title.substring(0, 40)}...`);
          const asset = await uploadImageToSanity(
            media.source_url,
            `${slug}.jpg`
          );
          if (asset) {
            sanityPost.coverImage = {
              _type: "image",
              asset: {
                _type: "reference",
                _ref: asset._id,
              },
            };
          }
        }
      } catch (error) {
        console.error(`  ⚠ Erro ao processar imagem do post ${slug}`);
      }
    }

    sanityPosts.push(sanityPost);

    if ((i + 1) % 50 === 0) {
      console.log(`  ✓ ${i + 1}/${wpPosts.length} posts processados`);
    }
  }

  console.log(`✅ ${sanityPosts.length} posts convertidos\n`);
  return sanityPosts;
}

async function importToSanity(posts) {
  console.log(`📤 Importando ${posts.length} posts para Sanity...`);

  const batch = 5;
  let imported = 0;

  for (let i = 0; i < posts.length; i += batch) {
    const chunk = posts.slice(i, i + batch);
    try {
      const mutations = chunk.map((post) => ({
        createIfNotExists: {
          _id: `post-${post.slug.current}`,
          ...post,
        },
      }));

      const result = await client.mutate(mutations);
      imported += result.results.length;
      const percent = Math.round((imported / posts.length) * 100);
      console.log(`  ✓ ${imported}/${posts.length} posts importados (${percent}%)`);
    } catch (error) {
      console.error(`Erro ao importar lote ${i / batch}:`, error.message);
    }
  }

  console.log(`✅ ${imported} posts importados!\n`);
}

async function main() {
  try {
    const wpPosts = await fetchWordPressPosts();
    const sanityPosts = await convertToSanity(wpPosts);
    await importToSanity(sanityPosts);
    console.log("🎉 Migração completa!");
  } catch (error) {
    console.error("❌ Erro na migração:", error.message);
    process.exit(1);
  }
}

main();
