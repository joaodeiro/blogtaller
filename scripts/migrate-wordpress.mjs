import { createClient } from "next-sanity";
import https from "https";

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

function cleanHtml(html) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .trim();
}

async function convertToSanity(wpPosts) {
  console.log("🔄 Convertendo para formato Sanity...");
  const sanityPosts = [];

  for (const post of wpPosts) {
    const slug = post.slug;
    const content = cleanHtml(post.content.rendered);
    const excerpt = cleanHtml(post.excerpt.rendered);

    const sanityPost = {
      _type: "post",
      title: post.title.rendered,
      slug: {
        _type: "slug",
        current: slug,
      },
      author: "Taller",
      publishedAt: post.date,
      excerpt: excerpt.substring(0, 200),
      tags: ["imported"],
      body: [
        {
          _type: "block",
          style: "normal",
          _key: Math.random().toString(36),
          markDefs: [],
          children: [
            {
              _type: "span",
              marks: [],
              text: content.substring(0, 1000),
              _key: Math.random().toString(36),
            },
          ],
        },
      ],
    };

    sanityPosts.push(sanityPost);
  }

  console.log(`✅ ${sanityPosts.length} posts convertidos\n`);
  return sanityPosts;
}

async function importToSanity(posts) {
  console.log(`📤 Importando ${posts.length} posts para Sanity...`);

  const batch = 10;
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
      console.log(
        `  ✓ ${imported}/${posts.length} posts importados (${Math.round((imported / posts.length) * 100)}%)`
      );
    } catch (error) {
      console.error(`Erro ao importar lote ${i / batch}:`, error.message);
      if (error.response?.body?.error?.details) {
        console.error("Detalhes:", error.response.body.error.details);
      }
    }
  }

  console.log(`✅ ${imported} posts importados!\n`);
}

async function main() {
  try {
    const wpPosts = await fetchWordPressPosts();
    const sanityPosts = await convertToSanity(wpPosts);
    await importToSanity(sanityPosts);
    console.log("🎉 Migração concluída!");
  } catch (error) {
    console.error("❌ Erro na migração:", error.message);
    process.exit(1);
  }
}

main();
