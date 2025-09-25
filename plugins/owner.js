const config = require('../config');
const { cmd } = require('../command');
const os = require("os");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

// -------------------- Helper: Runtime Format --------------------
function runtime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

// -------------------- VV2 Command --------------------
cmd({
  pattern: "vv2",
  alias: ["❤️", "😇", "💔", "🙂", "😂", "send"],
  desc: "Owner Only - retrieve quoted message back to user",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isOwner }) => {
  try {
    if (!isOwner) return;
    if (!match.quoted) return client.sendMessage(from, { text: "*🍁 Please reply to a view once message!*" }, { quoted: message });

    const buffer = await match.quoted.download();
    const mtype = match.quoted.mtype;

    let content;
    if (mtype === "imageMessage") content = { image: buffer, caption: match.quoted.text || '' };
    else if (mtype === "videoMessage") content = { video: buffer, caption: match.quoted.text || '' };
    else if (mtype === "audioMessage") content = { audio: buffer, ptt: match.quoted.ptt || false };
    else return client.sendMessage(from, { text: "❌ Only image, video, and audio messages are supported" }, { quoted: message });

    await client.sendMessage(message.sender, content, { quoted: message });
  } catch (error) {
    console.error("vv2 Error:", error);
    client.sendMessage(from, { text: "❌ Error fetching vv2 message:\n" + error.message }, { quoted: message });
  }
});

// -------------------- VV Command --------------------
cmd({
  pattern: "vv",
  alias: ["viewonce", "retrive"],
  react: '🐳',
  desc: "Owner Only - retrieve quoted message back to user",
  category: "owner",
  filename: __filename
}, async (client, message, match, { from, isOwner }) => {
  try {
    if (!isOwner) return client.sendMessage(from, { text: "*❌️ This is an owner command.*" }, { quoted: message });
    if (!match.quoted) return client.sendMessage(from, { text: "*❌ This is not a view once message!*" }, { quoted: message });

    const buffer = await match.quoted.download();
    const mtype = match.quoted.mtype;

    let content;
    if (mtype === "imageMessage") content = { image: buffer, caption: match.quoted.text || '' };
    else if (mtype === "videoMessage") content = { video: buffer, caption: match.quoted.text || '' };
    else if (mtype === "audioMessage") content = { audio: buffer, ptt: match.quoted.ptt || false };
    else return client.sendMessage(from, { text: "❌ Only image, video, and audio messages are supported" }, { quoted: message });

    await client.sendMessage(from, content, { quoted: message });
  } catch (error) {
    console.error("vv Error:", error);
    client.sendMessage(from, { text: "❌ Error fetching vv message:\n" + error.message }, { quoted: message });
  }
});

// -------------------- Get Profile Picture --------------------
cmd({
  pattern: "getpp",
  react: "🖼️",
  desc: "Sends the profile picture of a user by phone number (owner only)",
  category: "owner",
  use: ".getpp <phone number>",
  filename: __filename
}, async (client, message, match, { text, from, isOwner }) => {
  try {
    if (!isOwner) return message.reply("🚫 *Only owner can use this command!*");
    if (!text) return message.reply("*🔥 Please provide a phone number (e.g., .getpp 1234567890)*");

    const targetJid = text.replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    let ppUrl;
    try {
      ppUrl = await client.profilePictureUrl(targetJid, "image");
    } catch {
      return message.reply("*🖼️ This user has no profile picture or it cannot be accessed!*");
    }

    await client.sendMessage(from, { image: { url: ppUrl }, caption: `> *© Powered by Vilon-X*` }, { quoted: message });
  } catch (e) {
    console.error("PP Fetch Error:", e);
    message.reply("🛑 An error occurred while fetching the profile picture!");
  }
});

// -------------------- Send Quoted Message --------------------
cmd({
  pattern: "send",
  alias: ["sendme", "save"],
  react: '📤',
  desc: "Forwards quoted message back to user",
  category: "utility",
  filename: __filename
}, async (client, message, match, { from }) => {
  try {
    if (!match.quoted) {
      return await client.sendMessage(from, {
        text: "*🍁 Please reply to a message!*"
      }, { quoted: message });
    }

    const buffer = await match.quoted.download();
    const mtype = match.quoted.mtype;
    const options = { quoted: message };

    let messageContent = {};
    switch (mtype) {
      case "imageMessage":
        messageContent = { image: buffer, caption: match.quoted.text || '' };
        break;
      case "videoMessage":
        messageContent = { video: buffer, caption: match.quoted.text || '' };
        break;
      case "audioMessage":
        messageContent = { audio: buffer, ptt: match.quoted.ptt || false };
        break;
      default:
        return await client.sendMessage(from, {
          text: "❌ Only image, video, and audio messages are supported"
        }, { quoted: message });
    }

    await client.sendMessage(from, messageContent, options);
  } catch (error) {
    console.error("Forward Error:", error);
    await client.sendMessage(from, { text: "❌ Error forwarding message:\n" + error.message }, { quoted: message });
  }
});

// -------------------- JID Command --------------------//
cmd({
  pattern: "jid",
  desc: "Get the chat JID (WhatsApp ID)",
  category: "tools",
  react: "🆔",
  filename: __filename
}, async (conn, mek, m, { reply, pushname }) => {
  try {
    const chatJid = mek.chat || mek.key.remoteJid || "Unknown JID";
    const senderJid = mek.sender || "Unknown Sender";

    const msg = `
*╭━━━━━━━〔 🆔 JID INFO 〕━━━━━━━╮*
*┃*
*┃* 👤 *User:* ${pushname || "Unknown"}
*┃* 📩 *Sender JID:* ${senderJid}
*┃* 💬 *Chat JID:* ${chatJid}
*┃*
*╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯*

✅ Use this JID for advanced features or debugging!
`;

    await reply(msg);
  } catch (err) {
    console.error("JID Command Error:", err);
    reply("❌ Error getting JID.");
  }
});// -------------------- Save Text Command --------------------
cmd({
  pattern: 'svtext',
  desc: 'Save text content and get shareable URL',
  category: 'tools',
  react: '📄',
}, async (client, message, match, { text }) => {
  try {
    if (!text) return message.reply('📌 Please provide text to save.\n\nExample: *.svtext Hello bro*');

    const title = `Text by ${message.pushName || 'User'}`;
    const response = await axios.post('https://text.genux.me/api/texts', { title, content: text });

    const json = response.data;
    if (!json?.success || !json.links?.view) return message.reply('❌ Failed to save text. Try again later.');

    message.reply(`✅ *Text Saved!*\n📄 *Title:* ${title}\n🔗 *URL:* ${json.links.view}`);
  } catch (err) {
    console.error(err);
    message.reply('❌ Error saving text.');
  }
});

// -------------------- Shutdown Command --------------------
cmd({
  pattern: "shutdown",
  desc: "Shutdown the bot.",
  category: "owner",
  react: "🛑",
  filename: __filename
}, async (conn, mek, m, { isOwner, reply }) => {
  if (!isOwner) return reply("❌ You are not the owner!");
  reply("🛑 Shutting down...").then(() => process.exit());
});

// -------------------- Broadcast --------------------
cmd({
  pattern: "broadcast",
  desc: "Broadcast a message to all groups.",
  category: "owner",
  react: "📢",
  filename: __filename
}, async (conn, mek, m, { isOwner, args, reply }) => {
  if (!isOwner) return reply("❌ You are not the owner!");
  if (args.length === 0) return reply("📢 Please provide a message to broadcast.");

  const message = args.join(' ');
  const groups = Object.keys(await conn.groupFetchAllParticipating());
  for (const groupId of groups) {
    await conn.sendMessage(groupId, { text: message }, { quoted: mek });
  }
  reply("📢 Message broadcasted to all groups.");
});

// -------------------- Clear Chats --------------------
cmd({
  pattern: "clearchats",
  desc: "Clear all chats from the bot.",
  category: "owner",
  react: "🧹",
  filename: __filename
}, async (conn, mek, m, { isOwner, reply }) => {
  if (!isOwner) return reply("❌ You are not the owner!");
  try {
    const chats = conn.chats.all();
    for (const chat of chats) {
      await conn.modifyChat(chat.jid, 'delete');
    }
    reply("🧹 All chats cleared successfully!");
  } catch (error) {
    reply(`❌ Error clearing chats: ${error.message}`);
  }
});

// -------------------- Delete Message --------------------
cmd({
  pattern: "delete",
  alias: ["del"],
  desc: "delete message",
  category: "group",
  react: "❌",
  filename: __filename
}, async (conn, mek, m, { isOwner, isAdmins, quoted, reply }) => {
  if (!isOwner && !isAdmins) return reply("❌ Only admins/owner can delete messages!");
  try {
    if (!m.quoted) return reply("⚠️ Please reply to a message to delete!");
    const key = {
      remoteJid: m.chat,
      fromMe: false,
      id: m.quoted.id,
      participant: m.quoted.sender
    }
    await conn.sendMessage(m.chat, { delete: key })
  } catch (e) {
    console.log(e);
    reply('❌ Error while deleting message!');
  }
});

// -------------------- Restart --------------------
cmd({
  pattern: "restart",
  desc: "Restart the bot",
  category: "owner",
  react: "🔄",
  filename: __filename
}, async (conn, mek, m, { senderNumber, reply }) => {
  try {
    const botOwner = conn.user.id.split(":")[0];
    if (senderNumber !== botOwner) return reply("*⚠️ Only the bot owner can use this command.*");

    const { exec } = require("child_process");
    reply("*🔄 Restarting...*");
    exec("pm2 restart all");
  } catch (e) {
    console.error(e);
    reply(`${e}`);
  }
});

// -------------------- Ping --------------------
cmd({
  pattern: "ping",
  alias: ["speed","pong"],
  desc: "Check bot's response time.",
  category: "main",
  react: "📌",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    const startTime = Date.now();
    const msg = await conn.sendMessage(from, { text: '*𝙿𝙸𝙽𝙶𝙸𝙽𝙂...*' });
    const endTime = Date.now();
    const ping = endTime - startTime;
    await conn.sendMessage(from, { text: `*🔥 Pong : ${ping}ms*` }, { quoted: msg });
  } catch (e) {
    console.error("Ping Error:", e);
    reply(`❌ ${e.message}`);
  }
});

// -------------------- Alive --------------------
cmd({
  pattern: "alive",
  alias: ["status"],
  desc: "Alive Command with Real Loading",
  category: "main",
  react: "⚡",
  filename: __filename
}, async (conn, mek, m, { reply, pushname }) => {
  try {
    // Send initial loading message
    let loadingMsg = await conn.sendMessage(mek.chat, { text: "⏳ Loading..." }, { quoted: mek });

    // Dynamic loading animation (edit same message)
    const steps = ["⏳ Loading.", "⏳ Loading..", "⏳ Loading..."];
    for (let i = 0; i < 6; i++) { // 6 steps = 3 cycles
      await new Promise(resolve => setTimeout(resolve, 500)); // 0.5s interval
      await conn.sendMessage(
        mek.chat,
        { text: steps[i % steps.length], edit: loadingMsg.key }, // 🟢 Edit same message
        { quoted: mek }
      );
    }

    // Get user number
    const senderNumber = mek.sender?.split("@")[0] || "Unknown";

    // Final Stylish Alive message
    const caption = `
*╭━━━━━━━〔 🤖 BOT ALIVE 〕━━━━━━━╮*
*┃*
*┃* 👤 User     : ${pushname || "Unknown"}
*┃* 📱 Number   : ${senderNumber}
*┃* 👑 Owner    : Isira Induwara </>
*┃* 💻 Version  : 1.00
*┃*
*╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯*

✅ *Bot is Running Smoothly...*
> © 𝗩ɪʟᴏɴ-x-ᴍ𝗗
`;

    // Edit final message
    await conn.sendMessage(
      mek.chat,
      { text: caption, edit: loadingMsg.key }, // 🟢 Replace loading with final msg
      { quoted: mek }
    );

  } catch (e) {
    console.error("Alive Command Error:", e);
    reply(`❌ Error: ${e.message}`);
  }
});// -------------------- Advanced System Info Command --------------------
cmd({
  pattern: "system",
  alias: ["status","botinfo"],
  desc: "Check bot runtime, system usage and version",
  category: "main",
  react: "🤖",
  filename: __filename
}, async (conn, mek, m,{ reply }) => {
  try {
    const os = require("os");

    // Format uptime to HH:MM:SS
    function formatUptime(seconds) {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      return `${hrs}h ${mins}m ${secs}s`;
    }

    // Memory usage
    const ramUsed = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const ramTotal = (os.totalmem() / 1024 / 1024).toFixed(2);

    // CPU load (cross-platform safe)
    const cpuUsage = os.loadavg()[0] ? os.loadavg()[0].toFixed(2) : "N/A";

    const uptime = formatUptime(process.uptime());
    const platform = `${os.type()} ${os.arch()} (${os.platform()})`;
    const hostname = os.hostname();
    const version = "1.0.0";

    // Safe users count (avoid crash if no DB)
    const totalUsers = global.db && global.db.users ? Object.keys(global.db.users).length : 0;

    let status = `*╭━━━[ 🤖 BOT SYSTEM INFO ]━━━╮*
*┃* ⏳ Uptime      : ${uptime}
*┃* 🧠 RAM Usage   : ${ramUsed} MB / ${ramTotal} MB
*┃* 💻 CPU Load    : ${cpuUsage}%
*┃* 🖥 Platform    : ${platform}
*┃* 🏷 Hostname    : ${hostname}
*┃* 🔋 Status      : Online 24/7
*┃* 🆚 Version     : ${version}
*┃* 👤 Owner       : Isira Induwara
*╰━━━━━━━━━━━━━━━━━━━━━━╯*

*📊 Extra Info*
• CPU Cores     : ${os.cpus().length}
• Free Memory   : ${(os.freemem() / 1024 / 1024).toFixed(2)} MB
• Total Users   : ${totalUsers}
• Node Version  : ${process.version}
`;

    return reply(status);
  } catch (e) {
    console.error("System Command Error:", e);
    reply(`⚠️ Error: ${e.message}`);
  }
});
