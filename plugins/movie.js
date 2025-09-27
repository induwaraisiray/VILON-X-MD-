const axios = require("axios");
const { cmd } = require('../command');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 120 });

const API = "https://apis.sandarux.sbs/docs";
const WATERMARK = "\n\n*_© VILON-X-MD_*";

cmd({
  pattern: "sinhalasub",
  react: "🎬",
  alias: ["sub"],
  desc: "SinhalaSub Search & Download",
  category: "movie",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply("🎬 *Please provide a movie name*");

  try {
    const res = await axios.get(`${API}/api/download/sinhalasub/search?q=${encodeURIComponent(q)}`);
    const list = res?.data?.result?.data || [];

    if (!list.length) return reply("❌ No results found!");

    const movies = list.map((m, i) => ({ number: i + 1, title: m.title, link: m.link }));

    let text = `*🎬 SINHALASUB SEARCH RESULTS*\n\n`;
    movies.forEach(m => text += `*${m.number}* ➜ ${m.title}\n`);
    text += `\n🔢 Select a movie: Reply with the number${WATERMARK}`;

    const sentList = await conn.sendMessage(from, { text }, { quoted: mek });
    await conn.sendMessage(from, { react: { text: "🎥", key: sentList.key } });
    const key = sentList.key;

    const downloadMap = new Map();

    const handler = async (update) => {
      const message = update.messages[0];
      if (!message.message?.extendedTextMessage) return;

      const txt = message.message.extendedTextMessage.text.trim();
      const replyId = message.message.extendedTextMessage.contextInfo.stanzaId;

      if (replyId === key.id) {
        await conn.sendMessage(from, { react: { text: "🎥", key: message.key } });
        const idx = parseInt(txt);
        const movie = movies.find(m => m.number === idx);
        if (!movie) return reply("❌ Invalid selection!");

        const detailRes = await axios.get(`${API}/api/download/sinhalasub-dl?q=${encodeURIComponent(movie.link)}`);
        const data = detailRes.data?.result?.data;
        if (!data) return reply("❌ Movie details not found!");

        const title = data.title || movie.title; // fallback if title is missing

        const allLinks = [
          ...(data.pixeldrain_dl || []),
          ...(data.ddl_dl || [])
        ].map((dl, i) => ({
          number: i + 1,
          quality: dl.quality,
          size: dl.size,
          url: dl.link
        }));

        if (!allLinks.length) return reply("❌ No download links available!");

        let detailText = `*🎬 ${title}*\n
🗓️ *Year ➛* ${data.date}
🌍 *Country ➛* ${data.country}
🎭 *Genres ➛* ${data.category?.join(', ')}
⭐ *IMDB ➛* ${data.tmdbRate}
🤵‍♂ *Director ➛* ${data.director}
✍ *Subtitle by ➛* ${data.subtitle_author}\n
> *© ᴩᴏᴡᴇʀᴅ ʙʏ ᴠɪʟᴏɴ x ᴍᴅ*`;

        await conn.sendMessage(from, {
          image: { url: data.images?.[0] },
          caption: detailText
        }, { quoted: message });

        let qualityText = `*📥 Choose quality for:* *${title}*\n\n`;
        allLinks.forEach(dl => qualityText += `*${dl.number}* ➜ ${dl.quality} (${dl.size})\n`);
        qualityText += WATERMARK;

        const sentQuality = await conn.sendMessage(from, {
          text: qualityText
        }, { quoted: message });

        downloadMap.set(sentQuality.key.id, { title, links: allLinks });
      }

      else if (downloadMap.has(replyId)) {
        const { title, links } = downloadMap.get(replyId);
        const link = links.find(l => l.number === parseInt(txt));
        if (!link) return reply("❌ Invalid quality selection!");

        await conn.sendMessage(from, {
          react: { text: "⬆️", key: message.key }
        });

        const sizeStr = link.size.toLowerCase();
        let sizeInGB = 0;
        if (sizeStr.includes("gb")) {
          sizeInGB = parseFloat(sizeStr.replace("gb", "").trim());
        } else if (sizeStr.includes("mb")) {
          sizeInGB = parseFloat(sizeStr.replace("mb", "").trim()) / 1024;
        }

        if (sizeInGB > 2) {
          return conn.sendMessage(from, {
            text: `⚠ File Too Large\n\nFile size: ${link.size}\nThis file is too large to send directly.\n\n*Direct Download Link:*\n${link.url}${WATERMARK}`
          }, { quoted: message });
        }

        await conn.sendMessage(from, {
          document: { url: link.url },
          mimetype: "video/mp4",
          fileName: `${title} - ${link.quality}.mp4`,
          caption: `🎬 ${title} \n\n\`[WEB] ${link.quality}\`\n\n> _*© RAWANA MD*_`
        }, { quoted: message });

        await conn.sendMessage(from, { react: { text: "✅", key: message.key } });
      }
    };

    conn.ev.on("messages.upsert", handler);

  } catch (err) {
    console.error("SinhalaSub Error:", err);
    reply("❌ An error occurred while processing your request.");
  }
});
