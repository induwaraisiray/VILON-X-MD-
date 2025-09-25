const config = require("../config");
const { cmd } = require("../command");
const cheerio = require("cheerio");
const { fetch } = require("undici");
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require("../lib/functions");

// Axios instance
const axiosInstance = require("axios").create({
  timeout: 25_000, // prevent hanging
  maxRedirects: 5,
});

// If you need fb-downloader-scrapper
async function loadFbDownloader() {
  const module = await import("fb-downloader-scrapper");
  return module.default;
}

const api = `https://nethu-api-ashy.vercel.app`;
let session = Object.create(null); // safer empty object

// Small helpers
const isHttpUrl = (u) => typeof u === "string" && /^https?:\/\//i.test(u || "");
const safe = (v, d = null) => (v === undefined || v === null ? d : v);


cmd({
    pattern: "image",
    react: "☄️",
    alias: ["img", "photo"],
    desc: "Download google image",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, msr, creator, isGroup, sender, isSudo, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, participants, groupAdmins, isBotAdmins, isCreator, isDev, isAdmins, reply }) => {
    try {
        if (!q) return reply("*Please provide a valid Name !*");

        // Fetch the data from the API
        const data = await fetchJson("https://api-fix.onrender.com/api/search/googleimage?text=" + q);

        // Check if there are enough results
        if (!data.result || data.result.length < 1) {
            return reply("❌ No images found for your query.");
        }

        // Send up to 5 images
        const results = Math.min(data.result.length, 5); // Limit to 5 results
        for (let i = 0; i < results; i++) {
            await conn.sendMessage(from, {
                image: { url: data.result[i].url },
                caption: config.CAPTION
            }, { quoted: mek });
        }

    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        console.error(e);
        reply(`❌ *Error occurred!* \n\n${e.message || e}`);
    }
});

//==================================TIKTOK-DOWNLOAD==================================

cmd({
    pattern: "tiktok",
    alias: ["tt", "tiktokdl", "ttdown"],    
    desc: "Download TikTok videos or audio by link.",
    category: "download",
    react: "⬆️",
    filename: __filename
}, async (conn, mek, m, { args, reply, isQuoted }) => {
    try {
        if (!args[0]) return reply("❌ Please provide a TikTok video link.");

        const apiURL = `https://apii.ambalzz.biz.id/api/downloader/tiktokdl?url=${encodeURIComponent(args[0])}`;
        const { data } = await axios.get(apiURL);

        if (data.status !== 0) return reply("❌ Failed to fetch video. Try another link.");

        const videoData = data.data;
        const videoStats = data.video_view;
        const author = data.author;

        let captionMessage = `*TikTok Video Downloader* 🎥\n\n`;
        captionMessage += `🎥 *Caption:* ${videoData.caption_vid || "No caption"}\n`;
        captionMessage += `📊 *Views:* ${videoStats.views}\n`;
        captionMessage += `❤️ *Likes:* ${videoStats.likes}\n`;
        captionMessage += `💬 *Comments:* ${videoStats.comments}\n`;
        captionMessage += `⤵️ *Shares:* ${videoStats.shares}\n`;
        captionMessage += `🖊 *Author:* ${author.nickname} (@${author.username})\n`;
        captionMessage += `\n*Reply with:* \n*1 ||* *Video* 📽️\n *2 ||* *Audio* 🎵`;

        // Listen for user response
        conn.ev.on("messages.upsert", async message => {
            const receivedMessage = message.messages[0];
            if (!receivedMessage.message) return;

            const userResponse = receivedMessage.message.conversation || 
                                 receivedMessage.message.extendedTextMessage?.["text"];
            const chatID = receivedMessage.key.remoteJid;
            const isReplyToBotMessage = receivedMessage.message.extendedTextMessage &&
                                        receivedMessage.message.extendedTextMessage.contextInfo.stanzaId === messageID;

            if (isReplyToBotMessage) {
                await conn.sendMessage(chatID, {
                    react: { text: "⬇️", key: receivedMessage.key }
                });

                if (userResponse === "1") {
                    await conn.sendMessage(chatID, {
                        video: { url: videoData.video },
                        caption: "> "
                    }, { quoted: receivedMessage });
                } else if (userResponse === "2") {
                    await conn.sendMessage(chatID, {
                        audio: { url: videoData.music },
                        mimetype: "audio/mp4",
                        ptt: false 
                    }, { quoted: receivedMessage });
                } else {
                    reply("❌ Invalid choice! Reply with *1* for video or *2* for audio.");
                }

                await conn.sendMessage(chatID, {
                    react: { text: "⬆️", key: receivedMessage.key }
                });
            }
        });

    } catch (error) {
        console.error("TikTok Downloader Error:", error);
        reply("❌ Error fetching TikTok video. Try again later.");
    }
}); 

// Command to download TikTok video with watermark
cmd(
  {
    pattern: "tiktokwm",
    react: "💦",
    desc: "Download TikTok Video (With Watermark)",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      // Check if a URL is provided
      if (!q) return reply("Ex: `.tiktokwm https://vm.tiktok.com/XYZ123`");

      const tiktokUrl = q.trim();

      // Basic TikTok URL validation
      if (!tiktokUrl.includes("tiktok.com")) {
        return reply("❌ Please provide a valid TikTok URL.");
      }

      // API configuration using tikwm.com
      const API_URL = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;

      // Notify user of progress
      const processingMsg = await reply("♻️ *Processing Watermarked Video Download...*");

      // Fetch video info from API
      const response = await fetch(API_URL);
      const result = await response.json();

      // Check if the response is valid
      if (result.code !== 0 || !result.data || !result.data.wmplay) {
        return reply("❌ Error: Couldn't fetch watermarked video.");
      }

      // Send the watermarked video
      const wmVideoMsg = await robin.sendMessage(
        from,
        {
          video: { url: result.data.wmplay },
          caption: `*🫦 TikTok Watermarked Video 🫦*\n\n🎥 *Author*: ${result.data.author?.nickname || "Unknown"}\n\n*Made with Rasiya-MD🫦*`,
          mimetype: 'video/mp4'
        },
        { quoted: mek }
      );

      // Try to add reaction to the video message
      try {
        if (wmVideoMsg && wmVideoMsg.key) {
          await robin.sendMessage(from, { react: { text: "💦", key: wmVideoMsg.key } });
        }
      } catch (reactionError) {
        console.log("Reaction error:", reactionError);
      }

    } catch (e) {
      console.error("Error in TikTok watermarked download:", e);
      return reply(`❌ Error: ${e.message || "Something went wrong."}`);
    }
  }
);

// Command to download TikTok audio
cmd(
  {
    pattern: "tiktokaudio",
    react: "🎵",
    desc: "Download TikTok Audio",
    category: "download",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    try {
      // Check if a URL is provided
      if (!q) return reply("Ex: `.tiktokaudio https://vm.tiktok.com/XYZ123`");

      const tiktokUrl = q.trim();

      // Basic TikTok URL validation
      if (!tiktokUrl.includes("tiktok.com")) {
        return reply("❌ Please provide a valid TikTok URL.");
      }

      // API configuration using tikwm.com
      const API_URL = `https://www.tikwm.com/api/?url=${encodeURIComponent(tiktokUrl)}`;

      // Notify user of progress
      const processingMsg = await reply("🎵 *Processing Audio Download...*");

      // Fetch video info from API
      const response = await fetch(API_URL);
      const result = await response.json();

      // Check if the response is valid
      if (result.code !== 0 || !result.data || !result.data.music) {
        return reply("❌ Error: Couldn't fetch audio from this TikTok.");
      }

      const audioUrl = result.data.music;
      const title = result.data.music_info?.title || "TikTok Audio";
      const author = result.data.music_info?.author || result.data.author?.nickname || "Unknown";

      // Send the audio
      const audioMsg = await robin.sendMessage(
        from,
        {
          audio: { url: audioUrl },
          mimetype: 'audio/mp4',
          fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
          caption: `*🎵 TikTok Audio 🎵*\n\n🎵 *Title*: ${title}\n👤 *Artist*: ${author}\n\n> *Made with Vilon-x-md*`
        },
        { quoted: mek }
      );

      // Try to add reaction to the audio message
      try {
        if (audioMsg && audioMsg.key) {
          await robin.sendMessage(from, { react: { text: "🎵", key: audioMsg.key } });
        }
      } catch (reactionError) {
        console.log("Reaction error:", reactionError);
      }

    } catch (e) {
      console.error("Error in TikTok audio download:", e);
      return reply(`❌ Error: ${e.message || "Something went wrong."}`);
    }
  }
);


/* ======================= YOUTUBE POST DOWNLOADER ======================= */
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
        return reply(
          "Please provide a YouTube community post URL.\nExample: `.ytpost <url>`"
        );

      const { data } = await axios.get(
        `https://api.siputzx.my.id/api/d/ytpost?url=${encodeURIComponent(q)}`
      );

      if (!data?.status || !data?.data) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply("Failed to fetch the community post. Please check the URL.");
      }

      const post = data.data;
      let caption =
        `📢 *YouTube Community Post* 📢\n\n` + `📜 *Content:* ${safe(post?.content, "-")}`;

      const imgs = Array.isArray(post?.images) ? post.images : [];
      if (imgs.length > 0) {
        for (const img of imgs) {
          if (!isHttpUrl(img)) continue;
          await conn.sendMessage(
            from,
            { image: { url: img }, caption },
            { quoted: mek }
          );
          caption = ""; // only once
        }
      } else {
        await conn.sendMessage(from, { text: caption }, { quoted: mek });
      }

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (e) {
      console.error("ytpost:", e);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply("An error occurred while fetching the YouTube community post.");
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
      if (!q) return reply("❌ Please provide an app name to search.");

      await conn.sendMessage(from, { react: { text: "⏳", key: mek.key } });

      const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(
        q
      )}/limit=1`;
      const { data } = await axios.get(apiUrl);

      const list = data?.datalist?.list;
      if (!Array.isArray(list) || list.length === 0) {
        return reply("*⚠️ No results found for the given app name.*");
      }

      const app = list[0];
      const appSize = app?.size ? (app.size / 1048576).toFixed(2) : "N/A";
      const apkUrl = app?.file?.path_alt || app?.file?.path;
      const appIcon = app?.icon; // <-- App Icon URL

      if (!isHttpUrl(apkUrl)) return reply("⚠️ APK file not available.");

      const caption = `╭━━━〔 *APK Downloader* 〕━━━┈⊷
┃ 📦 *Name:* ${safe(app?.name, "-")}
┃ 🏋️ *Size:* ${appSize} MB
┃ 📦 *Package:* ${safe(app?.package, "-")}
┃ 📅 *Updated On:* ${safe(app?.updated, "-")}
┃ 👨‍💻 *Developer:* ${safe(app?.developer?.name, "-")}
╰━━━━━━━━━━━━━━━┈⊷
> *ᴩᴏᴡᴇʀᴅ ʙʏ ᴠɪʟᴏɴ-x-ᴍᴅ*`;

      await conn.sendMessage(from, { react: { text: "⬆️", key: mek.key } });

      // First send app icon with caption
      if (isHttpUrl(appIcon)) {
        await conn.sendMessage(
          from,
          {
            image: { url: appIcon },
            caption,
          },
          { quoted: mek }
        );
      } else {
        await reply(caption);
      }

      // Then send apk file
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

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (error) {
      console.error("apk:", error);
      reply("❌ An error occurred while fetching the APK. Please try again.");
    }
  }
);
/* ======================= GOOGLE DRIVE DOWNLOADER ======================= */
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
      if (!isHttpUrl(q)) {
        return reply("*❌ Please provide a valid Google Drive link.*");
      }

      await conn.sendMessage(from, { react: { text: "⬇️", key: mek.key } });

      const { data } = await axios.get(
        `https://api.fgmods.xyz/api/downloader/gdrive?url=${encodeURIComponent(
          q
        )}&apikey=mnp3grlZ`
      );

      const dl = data?.result;
      if (!isHttpUrl(dl?.downloadUrl)) {
        return reply("*⚠️ No download URL found. Please check the link and try again.*");
      }

      await conn.sendMessage(from, { react: { text: "⬆️", key: mek.key } });

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

      await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
    } catch (error) {
      console.error("gdrive:", error);
      reply("❌ An error occurred while fetching the Google Drive file. Please try again.");
    }
  }
);

//===============================MEDIA-FIRE-DOWNLOAD================================

const downloadInfo = {
    pattern: "mediafire",
    alias: ["mfire"],
    desc: "Download Mediafire files",
    category: "download",
    react: '📩',
    filename: __filename
  };
  
  cmd(downloadInfo, async (client, message, quotedMessage, {
    from, quoted, body, isCmd, command, args, q, reply
  }) => {
    try {
      if (!q || !q.startsWith("https://")) {
        return reply("*Please provide a valid Mediafire URL.* ❗");
      }
  
      const response = await fetch(q);
      const text = await response.text();
      const $ = cheerio.load(text);
  
      const fileName = $(".dl-info > div > div.filename").text().trim();
      const downloadUrl = $("#downloadButton").attr("href");
      const fileType = $(".dl-info > div > div.filetype").text().trim();
      const fileSize = $("body > main > div.content > div.center > div > div.dl-info > ul > li:nth-child(1) > span").text().trim();
      const fileDate = $("body > main > div.content > div.center > div > div.dl-info > ul > li:nth-child(2) > span").text().trim();
  
      if (!fileName || !downloadUrl) {
        return reply("⚠️ Failed to extract Mediafire download information. Please try a different link.");
      }
  
      let mimeType = "application/octet-stream"; // default fallback
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
        rar: "application/x-rar-compressed"
      };
  
      if (mimeTypes[ext]) {
        mimeType = mimeTypes[ext];
      }
  
      await client.sendMessage(from, {
        document: { url: downloadUrl },
        fileName: fileName,
        mimetype: mimeType,
        caption: `📄 *${fileName}*\n\n📁 Type: ${fileType}\n📦 Size: ${fileSize}\n📅 Uploaded: ${fileDate}`
      }, { quoted: quotedMessage });
  
    } catch (error) {
      console.error(error);
      reply("❌ Error while processing the Mediafire link.");
    }
  });

//===================================XXX-DOWNLOAD-COMMAND===========================

cmd({
  pattern: 'Pronehub',
  react: '🔞',
  alias: ['xxx','phub'],
  use: '.xxx <xxx-url>',
  desc: 'Download XXX Videos',
  category: 'download',
  filename: __filename
}, async (conn, m, { text, reply }) => {
  if (!text || !text.includes('pornhub.com')) return reply('Please provide a valid Pornhub video URL.!');

  try {
    const res = await axios.get(`https://api.agatz.xyz/api/pornhubdown?url=${encodeURIComponent(text)}`);
    const result = res.data;

    if (!result || !result.video_1) return reply('Download link not found.');

    await conn.sendMessage(m.chat, {
      video: { url: result.video_1 },
      caption: `*Title:* ${result.title || "Unknown"}`
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    reply('Error occurred while downloading.');
  }
});

cmd({
  pattern: "facebook",
  alias: ["fb"],
  react: "⬆️",
  desc: "Download Facebook Video",
  category: "download",
  filename: __filename,
}, async (conn, mek, m, { from, reply, q }) => {
  try {
    if (!q) return reply("*Please provide a valid Facebook video URL!*");

    const fbRegex = /(https?:\/\/)?(www\.)?(facebook|fb)\.com\/.+/;
    if (!fbRegex.test(q))
      return reply("*Invalid Facebook URL! Please check and try again.*");

    reply("*Fetching video details...*");

    const { getFbVideoInfo } = await import("fb-downloader-scrapper");
    const result = await getFbVideoInfo(q);

    if (!result || (!result.sd && !result.hd)) {
      return reply("*Failed to fetch video details. It may be private or unsupported.* ❌");
    }

    const { title, sd, hd } = result;

    const caption = `
╔═════════════════╗
║ 𝗙𝗕 𝗩𝗜𝗗𝗘𝗢 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥     
╠═════════════════╣
║ 📜 Title: ${title || "N/A"}
║ 📁 Quality: ${hd ? "HD & SD Available" : "Only SD Available"}
║
║ *Choose format to download:*
║ 1. HD Video
║ 2. SD Video
╚═════════════════╝
    `;

    const previewMsg = await conn.sendMessage(from, {
      image: {
        url: "https://i.imghippo.com/files/WU1039XIY.jpg",
      },
      caption,
    }, { quoted: mek });

    // Await user reply
    conn.ev.on("messages.upsert", async (update) => {
      const msg = update.messages[0];
      if (!msg?.message?.extendedTextMessage) return;

      const userReply = msg.message.extendedTextMessage.text.trim();
      const replyToMsgId = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
      if (replyToMsgId !== previewMsg.key.id) return;

      await conn.sendMessage(from, { react: { text: "⬆️", key: msg.key } });

      if (userReply === "1" && hd) {
        await conn.sendMessage(from, {
          video: { url: hd },
          caption: "🔹 *HD VIDEO*",
        }, { quoted: mek });
      } else if (userReply === "2" && sd) {
        await conn.sendMessage(from, {
          video: { url: sd },
          caption: "🔸 *SD VIDEO*",
        }, { quoted: mek });
      } else {
        reply("*Invalid option or video not available in that quality.*");
      }

      await conn.sendMessage(from, { react: { text: "✅", key: msg.key } });
    });

  } catch (e) {
    console.error("FB Download Error:", e);
    reply(`❌ *Error:* ${e.message || e}`);
  }
});
cmd(
  {
    pattern: "gitclone",
    alias: ["git", "getrepo"],
    desc: "Download GitHub repository as a zip file.",
    react: "📦",
    category: "downloader",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, reply }) => {
    try {
      const link = args?.[0];
      if (!link) {
        return reply(
          "❌ Where is the GitHub link?\n\nExample:\n.gitclone https://github.com/username/repository"
        );
      }

      if (!/^https?:\/\/github\.com\/.+/i.test(link)) {
        return reply("⚠️ Invalid GitHub link. Please provide a valid GitHub repository URL.");
      }

      const regex = /github\.com\/([^\/]+)\/([^\/]+?)(?:\.git|\/|$)/i;
      const match = link.match(regex);
      if (!match) throw new Error("Invalid GitHub URL.");

      const [, username, repo] = match;
      const zipUrl = `https://api.github.com/repos/${username}/${repo}/zipball`;

      // Use axios.head to avoid Node fetch dependency issues
      const head = await axios.head(zipUrl).catch((e) => ({ headers: {} }));
      const cd =
        head?.headers?.["content-disposition"] ||
        head?.headers?.["Content-Disposition"];
      const fileName =
        (cd && (cd.match(/filename="?([^"]+)"?/) || [])[1]) || `${repo}.zip`;

      reply(
        `📥 *Downloading repository...*\n\n*Repository:* ${username}/${repo}\n*Filename:* ${fileName}\n\n> *ᴩᴏᴡᴇʀᴅ ʙʏ ᴠɪʟᴏɴ-x-ᴍᴅ*`
      );

      await conn.sendMessage(
        from,
        {
          document: { url: zipUrl },
          fileName,
          mimetype: "application/zip",
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: "120363388320701164@newsletter",
              newsletterName: "induwara",
              serverMessageId: 143,
            },
          },
        },
        { quoted: mek }
      );
    } catch (error) {
      console.error("gitclone:", error);
      reply("*❌ Failed to download the repository. Please try again later.*");
    }
  }
);
