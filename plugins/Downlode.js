"use strict";

/**
 * Fixed Command Pack
 * - Consistent axios/fetchJson usage
 * - Cheerio import for MediaFire
 * - Safe error handling + reactions
 * - Removed undefined variables
 * - Safer null checks
 */

const axios = require("axios").create({
  timeout: 25000,
  maxRedirects: 5,
});
const cheerio = require("cheerio");
const { cmd } = require("../command");
const config = require("../config");
const { fetchJson } = require("../lib/functions");

const api = `https://nethu-api-ashy.vercel.app`;

// Helpers
const isHttpUrl = (u) => typeof u === "string" && /^https?:\/\//i.test(u || "");
const safe = (v, d = null) => (v === undefined || v === null ? d : v);

/* ======================= FACEBOOK DOWNLOADER ======================= */
cmd(
  {
    pattern: "facebook",
    react: "🎥",
    alias: ["fbb", "fbvideo", "fb"],
    desc: "Download videos from Facebook",
    category: "download",
    use: ".facebook <facebook_url>",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!isHttpUrl(q)) return reply("🚩 Please give me a valid Facebook URL.");

      const fb = await fetchJson(
        `${api}/download/fbdown?url=${encodeURIComponent(q)}`
      ).catch(() => null);

      const res = fb?.result || {};
      const sd = res.sd;
      const hd = res.hd;
      const thumb = res.thumb;

      if (!sd && !hd) return reply("I couldn't find anything :(");

      const caption = `*ɪɴᴅᴜᴡᴀʀᴀ ᴍᴅ ʙᴏᴛ*\n\n📝 ᴛɪᴛʟᴇ : Facebook video\n🔗 ᴜʀʟ : ${q}`;

      if (thumb && isHttpUrl(thumb)) {
        await conn.sendMessage(
          from,
          { image: { url: thumb }, caption },
          { quoted: mek }
        );
      }

      if (sd && isHttpUrl(sd)) {
        await conn.sendMessage(
          from,
          { video: { url: sd }, mimetype: "video/mp4", caption: `*SD-Quality*` },
          { quoted: mek }
        );
      }

      if (hd && isHttpUrl(hd)) {
        await conn.sendMessage(
          from,
          { video: { url: hd }, mimetype: "video/mp4", caption: `*HD-Quality*` },
          { quoted: mek }
        );
      }
    } catch (err) {
      console.error("facebook:", err);
      reply("*ERROR*");
    }
  }
);

/* ======================= TIKTOK DOWNLOADER ======================= */
cmd(
  {
    pattern: "tiktok",
    react: "📱",
    desc: "Download TikTok Video (No Watermark)",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("Ex: `.tiktok https://vm.tiktok.com/XYZ123`");
      if (!q.includes("tiktok.com")) return reply("❌ Invalid TikTok URL.");

      const API_URL = `https://www.tikwm.com/api/?url=${encodeURIComponent(q)}`;
      const { data: result } = await axios.get(API_URL);

      if (result.code !== 0 || !result.data?.play) {
        return reply("❌ Couldn't fetch video. Try again later.");
      }

      const videoUrl = result.data.play;
      const title = result.data.title || "TikTok Video";
      const author = result.data.author?.nickname || "Unknown";

      const caption =
        `*🪄 VILON-X-MD TIKTOK DOWNLOADER 🪄*\n\n` +
        `🎥 *Title*: ${title}\n` +
        `👤 *Author*: ${author}\n` +
        `🔗 *URL*: ${q}\n\n` +
        `> *Made with Vilon-x-MD*`;

      await conn.sendMessage(
        from,
        { video: { url: videoUrl }, caption, mimetype: "video/mp4" },
        { quoted: mek }
      );
    } catch (e) {
      console.error("tiktok:", e);
      reply(`❌ Error: ${e.message || "Something went wrong."}`);
    }
  }
);

cmd(
  {
    pattern: "tiktokwm",
    react: "💦",
    desc: "Download TikTok Video (With Watermark)",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("Ex: `.tiktokwm https://vm.tiktok.com/XYZ123`");
      if (!q.includes("tiktok.com")) return reply("❌ Invalid TikTok URL.");

      const API_URL = `https://www.tikwm.com/api/?url=${encodeURIComponent(q)}`;
      const { data: result } = await axios.get(API_URL);

      if (result.code !== 0 || !result.data?.wmplay) {
        return reply("❌ Couldn't fetch watermarked video.");
      }

      await conn.sendMessage(
        from,
        {
          video: { url: result.data.wmplay },
          caption: `*🫦 TikTok Watermarked Video 🫦*\n👤 Author: ${safe(
            result.data.author?.nickname,
            "Unknown"
          )}`,
          mimetype: "video/mp4",
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error("tiktokwm:", e);
      reply(`❌ Error: ${e.message || "Something went wrong."}`);
    }
  }
);

cmd(
  {
    pattern: "tiktokaudio",
    react: "🎵",
    desc: "Download TikTok Audio",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("Ex: `.tiktokaudio https://vm.tiktok.com/XYZ123`");
      if (!q.includes("tiktok.com")) return reply("❌ Invalid TikTok URL.");

      const API_URL = `https://www.tikwm.com/api/?url=${encodeURIComponent(q)}`;
      const { data: result } = await axios.get(API_URL);

      if (result.code !== 0 || !result.data?.music) {
        return reply("❌ Couldn't fetch TikTok audio.");
      }

      const title = result.data.music_info?.title || "TikTok Audio";
      const author =
        result.data.music_info?.author ||
        result.data.author?.nickname ||
        "Unknown";

      await conn.sendMessage(
        from,
        {
          audio: { url: result.data.music },
          mimetype: "audio/mp4",
          fileName: `${title.replace(/[^\w\s]/gi, "")}.mp3`,
          caption: `*🎵 TikTok Audio 🎵*\n🎵 Title: ${title}\n👤 Artist: ${author}`,
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error("tiktokaudio:", e);
      reply(`❌ Error: ${e.message || "Something went wrong."}`);
    }
  }
);

cmd(
  {
    pattern: "tikhelp",
    react: "ℹ️",
    desc: "Help for TikTok Downloader",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from }) => {
    const helpText = `*♻️ TikTok Downloader Help ♻️*

• .tiktok [url] - Download TikTok video without watermark
• .tiktokwm [url] - Download TikTok video with watermark
• .tiktokaudio [url] - Download TikTok audio only
• .tikhelp - Show this help message`;

    await conn.sendMessage(from, {
      image: {
        url: "https://github.com/chathurahansaka1/help/blob/main/src/f52f8647-b0fd-4f66-9cfa-00087fc06f9b.jpg?raw=true",
      },
      caption: helpText,
    });
  }
);

/* ======================= YOUTUBE POST ======================= */
cmd(
  {
    pattern: "ytpost",
    alias: ["ytcommunity", "ytc"],
    desc: "Download a YouTube community post",
    category: "downloader",
    react: "🎥",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!isHttpUrl(q))
        return reply("Please provide a valid YouTube community post URL.");

      const { data } = await axios.get(
        `https://api.siputzx.my.id/api/d/ytpost?url=${encodeURIComponent(q)}`
      );

      if (!data?.status || !data?.data) {
        return reply("Failed to fetch the community post.");
      }

      const post = data.data;
      let caption = `📢 *YouTube Community Post* 📢\n\n📜 *Content:* ${safe(
        post?.content,
        "-"
      )}`;

      const imgs = Array.isArray(post?.images) ? post.images : [];
      if (imgs.length > 0) {
        for (const img of imgs) {
          if (!isHttpUrl(img)) continue;
          await conn.sendMessage(
            from,
            { image: { url: img }, caption },
            { quoted: mek }
          );
          caption = "";
        }
      } else {
        await conn.sendMessage(from, { text: caption }, { quoted: mek });
      }
    } catch (e) {
      console.error("ytpost:", e);
      reply("❌ Error fetching the YouTube community post.");
    }
  }
);

/* ======================= APK DOWNLOADER ======================= */
cmd(
  {
    pattern: "apk",
    desc: "Download APK from Aptoide.",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ Please provide an app name.");

      const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(
        q
      )}/limit=1`;
      const { data } = await axios.get(apiUrl);

      const list = data?.datalist?.list;
      if (!Array.isArray(list) || list.length === 0) {
        return reply("⚠️ No results found.");
      }

      const app = list[0];
      const appSize = app?.size ? (app.size / 1048576).toFixed(2) : "N/A";
      const apkUrl = app?.file?.path_alt || app?.file?.path;

      if (!isHttpUrl(apkUrl)) return reply("⚠️ APK file not available.");

      const caption = `📦 *Name:* ${safe(app?.name, "-")}\n🏋️ *Size:* ${appSize} MB\n📦 *Package:* ${safe(
        app?.package,
        "-"
      )}`;

      if (isHttpUrl(app?.icon)) {
        await conn.sendMessage(
          from,
          { image: { url: app.icon }, caption },
          { quoted: mek }
        );
      } else {
        await reply(caption);
      }

      await conn.sendMessage(
        from,
        {
          document: {
            url: apkUrl,
            fileName: `${safe(app?.name, "app")}.apk`,
            mimetype: "application/vnd.android.package-archive",
          },
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error("apk:", e);
      reply("❌ Error fetching APK.");
    }
  }
);

/* ======================= GOOGLE DRIVE ======================= */
cmd(
  {
    pattern: "gdrive",
    desc: "Download Google Drive files.",
    react: "🌐",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!isHttpUrl(q)) return reply("❌ Please provide a valid Drive link.");

      const { data } = await axios.get(
        `https://api.fgmods.xyz/api/downloader/gdrive?url=${encodeURIComponent(
          q
        )}&apikey=mnp3grlZ`
      );

      const dl = data?.result;
      if (!isHttpUrl(dl?.downloadUrl)) {
        return reply("⚠️ No download URL found.");
      }

      await conn.sendMessage(
        from,
        {
          document: {
            url: dl.downloadUrl,
            mimetype: safe(dl.mimetype, "application/octet-stream"),
            fileName: safe(dl.fileName, "gdrive_file"),
          },
          caption: "*ᴩᴏᴡᴇʀᴅ ʙʏ ᴠɪʟᴏɴ-x-ᴍᴅ*",
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error("gdrive:", e);
      reply("❌ Error fetching Drive file.");
    }
  }
);

/* ======================= GITHUB ======================= */
cmd(
  {
    pattern: "gitclone",
    alias: ["git", "getrepo"],
    desc: "Download GitHub repo as zip.",
    react: "📦",
    category: "downloader",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, reply }) => {
    try {
      const link = args?.[0];
      if (!/^https?:\/\/github\.com\/.+/i.test(link || "")) {
        return reply("⚠️ Invalid GitHub link.");
      }

      const match = link.match(/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git|\/|$)/i);
      if (!match) return reply("⚠️ Invalid GitHub URL.");

      const [, username, repo] = match;
      const zipUrl = `https://api.github.com/repos/${username}/${repo}/zipball`;

      const head = await axios.head(zipUrl).catch(() => ({ headers: {} }));
      const cd =
        head?.headers?.["content-disposition"] ||
        head?.headers?.["Content-Disposition"];
      const fileName =
        (cd && (cd.match(/filename="?([^"]+)"?/) || [])[1]) || `${repo}.zip`;

      await conn.sendMessage(
        from,
        {
          document: { url: zipUrl },
          fileName,
          mimetype: "application/zip",
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error("gitclone:", e);
      reply("❌ Failed to download repository.");
    }
  }
);

/* ======================= MEDIAFIRE ======================= */
cmd(
  {
    pattern: "mediafire",
    alias: ["mfire"],
    desc: "Download Mediafire files",
    category: "download",
    react: "📩",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q || !q.startsWith("https://")) {
        return reply("❌ Please provide a valid Mediafire URL.");
      }

      const { data: html } = await axios.get(q);
      const $ = cheerio.load(html);

      const fileName = $(".dl-info > div > div.filename").text().trim();
      const downloadUrl = $("#downloadButton").attr("href");
      const fileType = $(".dl-info > div > div.filetype").text().trim();
      const fileSize = $(".dl-info ul li:nth-child(1) > span").text().trim();
      const fileDate = $(".dl-info ul li:nth-child(2) > span").text().trim();

      if (!fileName || !downloadUrl) {
        return reply("⚠️ Failed to extract Mediafire info.");
      }

      let mimeType = "application/octet-stream";
      const ext = fileName.split(".").pop().toLowerCase();
      const mimeTypes = {
        zip: "application/zip",
        pdf: "application/pdf",
        mp4: "video/mp4",
        mkv: "video/x-matroska",
        mp3: "audio/mpeg",
        "7z": "application/x-7z-compressed",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        rar: "application/x-rar-compressed",
      };
      if (mimeTypes[ext]) mimeType = mimeTypes[ext];

      await conn.sendMessage(
        from,
        {
          document: { url: downloadUrl },
          fileName,
          mimetype: mimeType,
          caption: `📄 *${fileName}*\n📁 Type: ${fileType}\n📦 Size: ${fileSize}\n📅 Uploaded: ${fileDate}`,
        },
        { quoted: mek }
      );
    } catch (e) {
      console.error("mediafire:", e);
      reply("❌ Error while processing Mediafire link.");
    }
  }
);

/* ======================= GOOGLE IMAGE ======================= */
cmd(
  {
    pattern: "image",
    react: "☄️",
    alias: ["img", "photo"],
    desc: "Search Google Images",
    category: "download",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      if (!q) return reply("❌ Please provide a search term.");

      const data = await fetchJson(
        "https://api-fix.onrender.com/api/search/googleimage?text=" + q
      );

      if (!data.result || data.result.length < 1) {
        return reply("❌ No images found.");
      }

      const results = Math.min(data.result.length, 5);
      for (let i = 0; i < results; i++) {
        await conn.sendMessage(
          from,
          { image: { url: data.result[i].url }, caption: config.CAPTION },
          { quoted: mek }
        }
      }
 );
    
cmd(
  {
    pattern: "apk1",
    react: "⏬",
    desc: "Download apk sever 2",
    category: "download",
    filename: __filename,
  },
  async (
    sock,
    m,
    store,
    {
      from,
      quoted,
      body,
      isCmd,
      command,
      args,
      q,
      isGroup,
      sender,
      senderNumber,
      botNumber2,
      botNumber,
      pushname,
      isMe,
      isOwner,
      groupMetadata,
      groupName,
      participants,
      groupAdmins,
      isBotAdmins,
      isAdmins,
      reply,
    }
  ) => {
    try {
      if (!q) return store.reply("*Provide an app name*");

      // Search APK
      let searchResult = await fetchJson(
        "https://bk9.fun/search/apk?q=" + q
      );

      // Get download info by ID
      let downloadData = await fetchJson(
        "https://bk9.fun/download/apk?id=" + searchResult.apk[0].id
      );

      const apkInfo = downloadData.apk || {};
      const apkName = apkInfo.name || "app.apk";
      const apkDlLink = apkInfo.dllink || apkInfo.download || apkInfo.url;
      // try common icon property names
      const iconUrl =
        apkInfo.icon || apkInfo.logo || apkInfo.thumbnail || apkInfo.image;

      // Notify downloading
      reply("*📥 DOWNLOADING...\n> 𝚅𝙸𝙻𝙾𝙽-𝚇-𝙼𝙳*");

      // If icon exists, send it first as an image (so user sees logo)
      if (iconUrl) {
        try {
          await sock.sendMessage(
            from,
            {
              image: { url: iconUrl },
              caption: `*${apkName}* - Logo`,
            },
            { quoted: m }
          );
        } catch (e) {
          // if sending image by URL fails, ignore and continue to send document
          console.log("Failed to send icon image:", e);
        }
      }

      // Send APK file as document (with mimetype)
      await sock.sendMessage(
        from,
        {
          document: { url: apkDlLink },
          fileName: apkName,
          mimetype: "application/vnd.android.package-archive",
          caption: "*✅ Successfully downloaded APK 📲*",
        },
        { quoted: m }
      );
    } catch (err) {
      console.log(err);
      reply("" + err);
    }
  }
);    