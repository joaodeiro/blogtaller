const https = require("https");
const fs = require("fs");

const WORDPRESS_API = "https://blog.taller.net.br/wp-json/wp/v2";
const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
const SANITY_TOKEN = process.env.SANITY_API_TOKEN;

if (!SANITY_TOKEN) {
  console.error("❌ SANITY_API_TOKEN não configurado");
  process.exit(1);
}

async function fetchWordPressPosts() {
  console.log("📥 Buscando posts do WordPress...");
  let allPosts = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `${WORDPRESS_API}/posts?per_page=100&page=${page}`;
    try {
      const response = await new Promise((resolve, reject) => {
        https
          .get(url, (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => resolve({ status: res.statusCode, data }));
          })
          .on("error", reject);
      });

      if (response.status !== 200) {
        hasMore = false;
        break;
      }

      const posts = JSON.parse(response.data);
      if (posts.length === 0) {
        hasMore = false;
      } else {
        allPosts = allPosts.concat(posts);
        console.log(`  ✓ Página ${page}: ${posts.length} posts`);
        page++;
      }
    } catch (error) {
      console.error(`Erro ao buscar página ${page}:`, error.message);
      hasMore = false;
    }
  }

  console.log(`✅ Total: ${allPosts.length} posts encontrados\n`);
  return allPosts;
}

async function convertToSanity(wpPosts) {
  console.log("🔄 Convertendo para formato Sanity...");
  const sanityPosts = [];

  for (const post of wpPosts) {
    const slug = post.slug;
    const content = post.content.rendered
      .replace(/<[^>]*>/g, "")
      .trim();

    const sanityPost = {
      _type: "post",
      title: post.title.rendered,
      slug: {
        _type: "slug",
        current: slug,
      },
      author: "Taller",
      publishedAt: post.date,
      excerpt: post.excerpt.rendered
        .replace(/<[^>]*>/g, "")
        .substring(0, 200),
      tags: post.tags ? [post.tags[0]?.name || "geral"] : ["geral"],
      body: [
        {
          _type: "block",
          style: "normal",
          _key: "block1",
          markDefs: [],
          children: [
            {
              _type: "span",
              marks: [],
              text: content.substring(0, 500),
              _key: "span1",
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

  const mutations = posts.map((post) => ({
    createIfNotExists: {
      _id: `post-${post.slug.current}`,
      ...post,
    },
  }));

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ mutations });

    const options = {
      hostname: `${SANITY_PROJECT_ID}.api.sanity.io`,
      path: `/v2021-06-07/data/mutate/${SANITY_DATASET}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data),
        Authorization: `Bearer ${SANITY_TOKEN}`,
      },
    };

    const req = https.request(options, (res) => {
      let response = "";
      res.on("data", (chunk) => (response += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          const result = JSON.parse(response);
          console.log(`✅ ${result.results.length} posts importados!\n`);
          resolve(result);
        } else {
          reject(new Error(`Status ${res.statusCode}: ${response}`));
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  try {
    const wpPosts = await fetchWordPressPosts();
    const sanityPosts = await convertToSanity(wpPosts);
    await importToSanity(sanityPosts);
    console.log("🎉 Migração concluída!");
  } catch (error) {
    console.error("❌ Erro na migração:", error);
    process.exit(1);
  }
}

main();
