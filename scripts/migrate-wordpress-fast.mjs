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

function decodeHtml(text) {
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

  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
}

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

async function fetchWordPressPosts() {
  console.log("📥 Buscando posts do WordPress...");
  let allPosts = [];
  let page = 1;

  while (true) {
    const url = `${WORDPRESS_API}/posts?per_page=100&page=${page}&_embed=wp:term`;
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

function getTags(post) {
  try {
    if (post._embedded && post._embedded["wp:term"] && post._embedded["wp:term"][1]) {
      const tags = post._embedded["wp:term"][1];
      return tags.slice(0, 5).map((t) => t.name);
    }
  } catch (e) {
    // ignore
  }
  return ["geral"];
}

function convertToSanity(wpPosts) {
  console.log("🔄 Convertendo para formato Sanity...");
  const sanityPosts = [];

  for (const post of wpPosts) {
    const title = decodeHtml(post.title.rendered);
    const excerpt = decodeHtml(post.excerpt.rendered);
    const content = stripHtml(post.content.rendered);

    const sanityPost = {
      _type: "post",
      title: title,
      slug: {
        _type: "slug",
        current: post.slug,
      },
      author: "Taller",
      publishedAt: post.date,
      excerpt: excerpt.substring(0, 200),
      tags: getTags(post),
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
              text: content.substring(0, 2000),
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
      const percent = Math.round((imported / posts.length) * 100);
      console.log(`  ✓ ${imported}/${posts.length} posts importados (${percent}%)`);
    } catch (error) {
      console.error(`⚠ Erro ao importar lote ${i / batch}:`, error.message);
    }
  }

  console.log(`✅ ${imported} posts importados!\n`);
}

async function main() {
  try {
    const wpPosts = await fetchWordPressPosts();
    const sanityPosts = convertToSanity(wpPosts);
    await importToSanity(sanityPosts);
    console.log("🎉 Migração completa!");
  } catch (error) {
    console.error("❌ Erro na migração:", error.message);
    process.exit(1);
  }
}

main();
