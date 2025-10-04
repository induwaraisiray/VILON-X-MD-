// convert.js (cleaned & deobfuscated)
const { cmd, commands } = require("../command");
const {
  getBuffer,
  getGroupAdmins,
  getRandom,
  h2k,
  isUrl,
  Json,
  runtime,
  sleep,
  fetchJson
} = require('../lib/functions');
const config = require("../config");
const fs = require('fs');
const axios = require("axios");
const googleTTS = require("google-tts-api");
const { tmpdir } = require('os');
const translate = require('translate-google-api');
const Crypto = require("crypto");
const imbb = require("darksadasyt-imgbb-scraper");
const fileType = require("file-type");
const { Sticker, createSticker, StickerTypes } = require("wa-sticker-formatter");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");

/**
 * Convert a video buffer to a WebP buffer (used for animated stickers).
 * Writes temporary files to OS tmpdir and removes them after conversion.
 * @param {Buffer} videoBuffer
 * @returns {Buffer} webpBuffer
 */
async function videoToWebp(videoBuffer) {
  const webpPath = path.join(
    tmpdir(),
    Crypto.randomBytes(6).readUIntLE(0, 6).toString(24) + ".webp"
  );
  const mp4Path = path.join(
    tmpdir(),
    Crypto.randomBytes(6).readUIntLE(0, 6).toString(24) + ".mp4"
  );

  fs.writeFileSync(mp4Path, videoBuffer);

  await new Promise((resolve, reject) => {
    ffmpeg(mp4Path)
      .on("error", reject)
      .on("end", () => resolve(true))
      .addOutputOptions([
        "-vcodec", "libwebp",
        "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
        "-loop", "0",
        "-ss", "00:00:00",
        "-t", "00:00:05",
        "-preset", "default",
        "-an",
        "-vsync", "0"
      ])
      .toFormat("webp")
      .save(webpPath);
  });

  const webpBuffer = fs.readFileSync(webpPath);
  fs.unlinkSync(webpPath);
  fs.unlinkSync(mp4Path);
  return webpBuffer;
}

/**
 * Convenience wrappers for ffmpeg conversions (used by other commands).
 * They mirror the original usage in the obfuscated file.
 */
function toAudio(input, output) {
  return ffmpeg(input, ["-vn", "-ac", "2", "-b:a", "128k", "-ar", "44100", "-f", "mp3"], output, 'mp3');
}
function toPTT(input, output) {
  return ffmpeg(input, ["-vn", "-c:a", "libopus", "-b:a", "128k", "-vbr", "on", "-compression_level", "10"], output, 'opus');
}
function toVideo(input, output) {
  return ffmpeg(input, ["-c:v", "libx264", "-c:a", "aac", "-ab", "128k", "-ar", "44100", "-crf", "32", "-preset", "slow"], output, "mp4");
}

/**
 * .img2url - Upload an image (reply or direct) to imgbb and return URL
 */
cmd({
  pattern: 'img2url',
  react: '🔗',
  alias: ["tourl", "imgurl", "telegraph", "imgtourl"],
  desc: "Convert image to URL",
  category: 'convert',
  use: ".img2url <reply image>",
  filename: __filename
}, async (client, message, msgObj, {
  from, l: logError, prefix, quoted, body, isCmd, command,
  args, q, isGroup, sender, senderNumber, botNumber2, botNumber,
  pushname, isMe, isOwner, groupMetadata, groupName, participants,
  groupAdmins, isBotAdmins, isAdmins, reply
}) => {
  try {
    const repliedIsImage = msgObj.quoted ? (msgObj.quoted.type === "imageMessage" || (msgObj.quoted.type === "viewOnceMessage" && msgObj.quoted.msg.type === 'imageMessage')) : false;

    if (msgObj.type === "imageMessage" || repliedIsImage) {
      const tmpName = getRandom('');
      const imageBuffer = repliedIsImage ? await msgObj.quoted.download(tmpName) : await msgObj.download(tmpName);
      const detected = await fileType.fromBuffer(imageBuffer); // returns {ext, mime}
      await fs.promises.writeFile('./' + detected.ext, imageBuffer);
      const uploadedUrl = await imbb('./' + detected.ext);
      await reply("*🍟Here is the image URL:* \n\n" + uploadedUrl);
    } else {
      return reply("Please reply to an image or send an image.");
    }
  } catch (err) {
    reply("Sorry, I couldn't process the image.");
    logError(err);
  }
});

/**
 * .sticker - Convert image or sticker to WhatsApp sticker.
 */
cmd({
  pattern: "sticker",
  react: '🔮',
  alias: ['s', "stic"],
  desc: "Convert to sticker",
  category: "convert",
  use: ".sticker <Reply to image>",
  filename: __filename
}, async (client, quotedMsg, msgObj, {
  from, l: logError, quoted, body, isCmd, command, args, q,
  isGroup, sender, senderNumber, botNumber2, botNumber, pushname,
  isMe, isOwner, groupMetadata, groupName, participants, groupAdmins,
  isBotAdmins, isAdmins, reply
}) => {
  try {
    const quotedIsViewOnce = msgObj.quoted ? msgObj.quoted.type === 'viewOnceMessage' : false;
    const quotedIsImage = msgObj.quoted ? (msgObj.quoted.type === "imageMessage" || (quotedIsViewOnce ? msgObj.quoted.msg.type === "imageMessage" : false)) : false;
    const quotedIsSticker = msgObj.quoted ? msgObj.quoted.type === 'stickerMessage' : false;

    if (msgObj.type === 'imageMessage' || quotedIsImage) {
      const tmpName = getRandom('');
      if (quotedIsImage) {
        await msgObj.quoted.download(tmpName);
      } else {
        await msgObj.download(tmpName);
      }

      let stickerOptions = {
        pack: pushname,
        author: "©VILON-X-MD",
        type: args.includes("--crop") || args.includes("-c") ? StickerTypes.CROPPED : StickerTypes.FULL,
        categories: ['🤩', '🎉'],
        id: "12345",
        quality: 75,
        background: 'transparent'
      };

      let stickerFilePath = tmpName + ".jpg";
      let stickerObj = new Sticker(stickerFilePath, stickerOptions);
      const stickerBuffer = await stickerObj.toBuffer();

      return client.sendMessage(from, { sticker: stickerBuffer }, { quoted: quotedMsg });
    } else if (quotedIsSticker) {
      const tmpName = getRandom('');
      await msgObj.quoted.download(tmpName);

      let stickerOptions = {
        pack: pushname,
        author: '',
        type: args.includes("--crop") || args.includes("-c") ? StickerTypes.CROPPED : StickerTypes.FULL,
        categories: ['🤩', '🎉'],
        id: "12345",
        quality: 75,
        background: "transparent"
      };

      let stickerFilePath = tmpName + ".webp";
      let stickerObj = new Sticker(stickerFilePath, stickerOptions);
      const stickerBuffer = await stickerObj.toBuffer();

      return client.sendMessage(from, { sticker: stickerBuffer }, { quoted: quotedMsg });
    } else {
      // original code attempted to call imgmsg variable — keep original behavior (may be defined globally)
      return await reply(imgmsg);
    }
  } catch (error) {
    reply("*Error !!*");
    logError(error);
  }
});

/**
 * .attp - convert text to animated sticker (via third-party API)
 */
cmd({
  pattern: "attp",
  react: '✨',
  alias: ['texttogif'],
  desc: "Text to convert sticker",
  category: "convert",
  use: ".attp HI",
  filename: __filename
}, async (client, message, msgObj, {
  from, l: logError, quoted, body, isCmd, command, args, q,
  isGroup, sender, senderNumber, botNumber2, botNumber, pushname,
  isMe, isOwner, groupMetadata, groupName, participants, groupAdmins,
  isBotAdmins, isAdmins, reply
}) => {
  try {
    if (!q) {
      return await reply(imgmsg);
    }
    let buffer = await getBuffer('https://api-fix.onrender.com/api/maker/attp?text=' + encodeURIComponent(q));
    await client.sendMessage(from, {
      sticker: await videoToWebp(buffer)
    }, { quoted: message });
  } catch (err) {
    console.log(err);
  }
});

/**
 * .tts - text to speech using google-tts-api
 */
cmd({
  pattern: "tts",
  react: '❄️',
  desc: "text to speech.",
  category: 'convert',
  filename: __filename,
  use: ".tts hi"
}, async (client, quotedMessage, msgObj, {
  from, quoted, body, isCmd, command, args, q, isGroup, sender,
  senderNumber, botNumber2, botNumber, pushname, isMe, isOwner,
  groupMetadata, groupName, participants, groupAdmins, isBotAdmins,
  isAdmins, reply
}) => {
  try {
    if (!q) {
      return quotedMessage.reply("Please give me Sentence to change into audio.");
    }
    const audioUrl = googleTTS.getAudioUrl(q, {
      lang: 'en',
      slow: false,
      host: "https://translate.google.com"
    });

    return client.sendMessage(msgObj.chat, {
      audio: { url: audioUrl },
      mimetype: "audio/mpeg",
      fileName: 'ttsCitelVoid.m4a'
    }, { quoted: quotedMessage });
  } catch (err) {
    reply("*Error !!*");
    console.error(err);
  }
});

/**
 * .toptt - convert replied video to audio/voice (opus)
 */
cmd({
  pattern: 'toptt',
  react: '🔊',
  alias: ['toaudio', "tomp3"],
  desc: "convert to audio",
  category: "convert",
  use: ".toptt <Reply to video>",
  filename: __filename
}, async (client, message, msgObj, {
  from, l: logError, quoted, body, isCmd, command, args, q,
  isGroup, sender, senderNumber, botNumber2, botNumber, pushname,
  isMe, isOwner, groupMetadata, groupName, participants, groupAdmins,
  isBotAdmins, isAdmins, reply
}) => {
  try {
    const isVideo = msgObj.quoted ? msgObj.quoted.type === "videoMessage" : msgObj ? msgObj.type === "videoMessage" : false;
    if (!isVideo) {
      return await reply();
    }
    const videoBuffer = msgObj.quoted ? await msgObj.quoted.download() : await msgObj.download();
    const audioResult = await ffmpeg(videoBuffer, ["-vn", "-c:a", "libopus", "-b:a", "128k", "-vbr", "on", "-compression_level", "10"], 'mp4', 'opus');
    const sent = await client.sendMessage(msgObj.chat, {
      audio: audioResult.options,
      mimetype: 'audio/mpeg'
    }, { quoted: msgObj });
    await client.sendMessage(from, {
      react: {
        text: '🎼',
        key: sent.key
      }
    });
  } catch (err) {
    reply("*Error !!*");
    logError(err);
  }
});

/**
 * .boom - forward quoted message multiple times (keeps original structure)
 */
cmd({
  pattern: "boom",
  desc: "forward msgs",
  alias: ["bbb"],
  category: "convert",
  use: ".boom <jid> & <count>",
  filename: __filename
}, async (client, message, msgObj, {
  from, l: logError, quoted, body, isCmd, command, args, q,
  isGroup, sender, senderNumber, botNumber2, botNumber, pushname,
  isMe, isOwner, groupMetadata, groupName, participants, groupAdmins,
  isBotAdmins, isAdmins, reply
}) => {
  if (!q || !msgObj.quoted) {
    reply("*Give me message ❌*");
  }
  const targetJid = q.split(" & ")[0];
  const count = q.split(" & ")[1];
  let i = 0;
  let fileNameHint;
  let fakeKeyObj = { key: message.quoted?.["fakeObj"]?.["key"] };

  // handle document with caption renaming as original code did
  if (message.quoted?.['documentWithCaptionMessage']?.["message"]?.["documentMessage"]) {
    let mime = message.quoted.documentWithCaptionMessage.message.documentMessage.mimetype;
    const mimeTypes = require("mime-types");
    let ext = mimeTypes.extension(mime);
    message.quoted.documentWithCaptionMessage.message.documentMessage.fileName = (fileNameHint ? fileNameHint : message.quoted.documentWithCaptionMessage.message.documentMessage.caption) + '.' + ext;
  }

  fakeKeyObj.message = message.quoted;

  while (i < count) {
    i++;
    // original file didn't actually send the forwarded messages here — keeping logic unchanged
  }

  return reply("*🔀 Boom sender to:*\n\n " + targetJid);
});

/**
 * .readmore - create read-more style message
 */
cmd({
  pattern: "readmore",
  desc: "Readmore message",
  category: "convert",
  use: ".readmore < text >",
  react: '📝',
  filename: __filename
}, async (client, message, msgObj, {
  from, quoted, body, isCmd, command, args, q, isGroup, sender
}) => {
  try {
    const text = q ? q : "No text provided";
    const ZERO_WIDTH_REPEAT = '\u200b'.repeat(4000); // 0xfa0 = 4000
    const out = '' + ZERO_WIDTH_REPEAT + text;
    await client.sendMessage(from, { text: out }, { quoted: message });
    await client.sendMessage(from, { react: { text: '', key: message.key } });
  } catch (err) {
    console.log(err);
    reply("Error: " + err.message);
  }
});

/**
 * .jsobfus - obfuscate provided JavaScript code using javascript-obfuscator
 */
cmd({
  pattern: "jsobfus",
  desc: "Js code obfus.",
  alias: ["encript", "obfus"],
  react: '🫧',
  use: ".jsobfus js code",
  category: 'convert',
  filename: __filename
}, async (client, message, msgObj, {
  from, q, args, reply
}) => {
  try {
    const obfuscated = JavaScriptObfuscator.obfuscate(q);
    reply(obfuscated.getObfuscatedCode());
  } catch (err) {
    console.error(err);
    reply("An error occurred: " + err.message);
  }
});

/**
 * .translate - translate "<text> to <lang>"
 */
cmd({
  pattern: "translate",
  alias: ['trt'],
  react: '🌐',
  desc: "Translate text to a specified language",
  category: "convert",
  use: ".translate <text> to <language>",
  filename: __filename
}, async (client, message, msgObj, {
  from, reply, q
}) => {
  try {
    const [text, toLang] = q.split(" to ");
    if (!text || !toLang) {
      return await reply(".trt How are you to si");
    }
    const translated = await translate(text, { to: toLang });
    await reply("*⏩ Translated Text*\n\n" + translated);
  } catch (err) {
    console.error(err);
    reply("An error occurred while translating the text. Please try again later.");
  }
});

/**
 * .gitclone - send GitHub repo zip via URL
 */
cmd({
  pattern: "gitclone",
  alias: ["gitdl"],
  react: '💫',
  desc: "Download git repos",
  category: "convert",
  use: ".gitclone <repo link>",
  filename: __filename
}, async (client, message, msgObj, {
  from, l: logError, quoted, body, isCmd, command, args, q, isGroup,
  sender, senderNumber, botNumber2, botNumber, pushname, isMe,
  isOwner, groupMetadata, groupName, participants, groupAdmins,
  isBotAdmins, isAdmins, reply
}) => {
  try {
    if (!q) return await reply(needus);
    const githubRegex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;
    if (!githubRegex.test(q)) {
      return reply("🚩*Please Give Me Valid GitHub Repo Link!*");
    }
    let [, owner, repo] = q.match(githubRegex) || [];
    repo = repo.replace(/.git$/, '');
    const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball`;
    // HEAD request to get file name from content-disposition
    const head = await fetch(zipUrl, { method: 'HEAD' });
    const contentDisposition = head.headers.get("content-disposition") || "";
    const fileNameMatch = contentDisposition.match(/attachment; filename=(.*)/) || [];
    const fileName = fileNameMatch[1] || `${repo}.zip`;
    const caption = config.FOOTER;
    await client.sendMessage(from, {
      document: { url: zipUrl },
      mimetype: "application/zip",
      fileName,
      caption
    }, { quoted: message });
  } catch (err) {
    reply(cantf);
    console.log(err);
  }
});

/**
 * .npm - search npm registry for package info
 */
cmd({
  pattern: "npm1",
  desc: "Search for a package on npm.",
  react: '📦',
  use: ".npm < name >",
  category: "convert",
  filename: __filename
}, async (client, message, msgObj, {
  from, args, reply
}) => {
  if (!args.length) {
    return reply("Please provide the name of the npm package you want to search for. Example: !npm express");
  }
  const pkgName = args.join(" ");
  const url = 'https://registry.npmjs.org/' + encodeURIComponent(pkgName);
  try {
    let res = await fetch(url);
    if (!res.ok) throw new Error("Package not found or an error occurred.");
    let data = await res.json();
    const latest = data["dist-tags"].latest;
    const description = data.description || "No description available.";
    const npmUrl = "https://www.npmjs.com/package/" + pkgName;
    const license = data.license || "Unknown";
    const repository = data.repository ? data.repository.url || "Not available" : "Not available";

    let out =
`💃 VILON-X-MD NPM SEARCH 💃

┌──────────────────
├ 🦑 Npm name : ${pkgName}
├ 💨 Description : ${description}
├ ⏩ latest version : ${latest}
├ 📄 License : ${license}
├ 👨‍🔧 Repostory : ${repository}
├ 🔗 Url : ${npmUrl}
└──────────────────`;

    await client.sendMessage(from, { text: out }, { quoted: message });
  } catch (err) {
    console.error(err);
    reply("An error occurred: " + err.message);
  }
});

/**
 * .ss - web screenshot (via external API)
 */
cmd({
  pattern: 'ss',
  alias: ["webss"],
  react: '💡',
  desc: "web screenshot",
  category: "convert",
  use: ".ss <query>",
  filename: __filename
}, async (client, message, msgObj, {
  from, reply, q
}) => {
  try {
    if (!q) return await reply("Please provide a search query!");
    const res = await axios.get('https://api.pikwy.com/?tkn=125&d=3000&u=' + encodeURIComponent(q) + "&fs=0&w=1280&h=1200&s=100&z=100&f=jpg&rt=jweb");
    await client.sendMessage(from, { image: { url: res.data.iurl }, caption: config.FOOTER }, { quoted: message });
  } catch (err) {
    console.error(err);
    reply("An error occurred while processing your request. Please try again later.");
  }
});

/**
 * .vv - fetch and resend a ViewOnce message's content (image/video/audio)
 */
cmd({
  pattern: 'vv3',
  react: '🥱',
  alias: ["retrive", 'viewonce'],
  desc: "Fetch and resend a ViewOnce message content (image/video/voice).",
  category: "misc",
  use: "<query>",
  filename: __filename
}, async (client, message, msgObj, {
  from, reply
}) => {
  try {
    if (!msgObj.quoted) return reply("Please reply to a ViewOnce message.");
    const quotedType = msgObj.quoted.type;
    let ext;
    let sendType;

    if (quotedType === 'imageMessage') {
      ext = 'jpg'; sendType = "image";
    } else if (quotedType === "videoMessage") {
      ext = "mp4"; sendType = 'video';
    } else if (quotedType === "audioMessage") {
      ext = 'mp3'; sendType = "audio";
    } else {
      return reply("Please reply to an image, video, or audio message 🔥.");
    }

    const mediaBuffer = await msgObj.quoted.download();
    const fileName = Date.now() + '.' + ext;
    fs.writeFileSync(fileName, mediaBuffer);
    let payload = {};
    payload[sendType] = fs.readFileSync(fileName);
    await client.sendMessage(msgObj.chat, payload);
    fs.unlinkSync(fileName);
  } catch (err) {
    console.log("Error:", err);
    reply("An error occurred while fetching the ViewOnce message.", err);
  }
});