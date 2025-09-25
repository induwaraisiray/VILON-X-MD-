const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const os = require("os");
const path = require("path");
const config = require("../config");
const { cmd, commands } = require("../command");

// COUNTRY INFO
cmd({
  pattern: "countryinfo",
  alias: ["cinfo", "country", "cinfo2"],
  desc: "Get information about a country",
  category: "info",
  react: "🌍",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, react }) => {
  try {
    if (!q) return reply("Please provide a country name.\nExample: `.countryinfo Pakistan`");

    const apiUrl = `https://api.siputzx.my.id/api/tools/countryInfo?name=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl);

    if (!data.status || !data.data) {
      await react("❌");
      return reply(`No information found for *${q}*. Please check the country name.`);
    }

    const info = data.data;
    let neighborsText = info.neighbors.length > 0
      ? info.neighbors.map(n => `🌍 *${n.name}*`).join(", ")
      : "No neighboring countries found.";

    const text = `🌍 *Country Information: ${info.name}* 🌍\n\n` +
      `🏛 *Capital:* ${info.capital}\n` +
      `📍 *Continent:* ${info.continent.name} ${info.continent.emoji}\n` +
      `📞 *Phone Code:* ${info.phoneCode}\n` +
      `📏 *Area:* ${info.area.squareKilometers} km² (${info.area.squareMiles} mi²)\n` +
      `🚗 *Driving Side:* ${info.drivingSide}\n` +
      `💱 *Currency:* ${info.currency}\n` +
      `🔤 *Languages:* ${info.languages.native.join(", ")}\n` +
      `🌟 *Famous For:* ${info.famousFor}\n` +
      `🌍 *ISO Codes:* ${info.isoCode.alpha2.toUpperCase()}, ${info.isoCode.alpha3.toUpperCase()}\n` +
      `🌎 *Internet TLD:* ${info.internetTLD}\n\n` +
      `🔗 *Neighbors:* ${neighborsText}`;

    await conn.sendMessage(from, {
      image: { url: info.flag },
      caption: text,
      contextInfo: { mentionedJid: [m.sender] }
    }, { quoted: mek });

    await react("✅");
  } catch (e) {
    console.error("Error in countryinfo command:", e);
    await react("❌");
    reply("An error occurred while fetching country information.");
  }
});

// MSG

cmd({
  pattern: "msg",
  desc: "Send a message multiple times (Owner Only)",
  category: "utility",
  react: "👾",
  filename: __filename
},
async (conn, mek, m, {
  from,
  reply,
  isCreator,
  q
}) => {
  // Owner-only restriction
  if (!isCreator) return reply('🚫 *Owner only command!*');

  try {
    // Check format: .msg text,count
    if (!q.includes(',')) {
      return reply("❌ *Format:* .msg text,count\n*Example:* .msg Hello,5");
    }

    const [message, countStr] = q.split(',');
    const count = parseInt(countStr.trim());

    // Hard limit: 1-100 messages
    if (isNaN(count) || count < 1 || count > 1000) {
      // Fixed the error message to be more accurate
      return reply("❌ *Message count must be between 1 and 1000.*");
    }

    // Silent execution (no confirmations)
    for (let i = 0; i < count; i++) {
      await conn.sendMessage(from, {
        text: message
      }, {
        quoted: null
      });
      if (i < count - 1) await new Promise(resolve => setTimeout(resolve, 100)); // 500ms delay
    }

  } catch (e) {
    console.error("Error in msg command:", e);
    reply(`❌ *Error:* ${e.message}`);
  }
});

//temp mail


cmd({
  pattern: "tempmail",
  alias: ["genmail"],
  desc: "Generate a new temporary email address",
  category: "utility",
  react: "📧",
  filename: __filename
},
async (conn, mek, m, {
  from,
  reply,
  prefix
}) => {
  try {
    const response = await axios.get('https://apis.davidcyriltech.my.id/temp-mail');
    const {
      email,
      session_id,
      expires_at
    } = response.data;

    // Format the expiration time and date
    const expiresDate = new Date(expires_at);
    const timeString = expiresDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const dateString = expiresDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Create the complete message
    const message = `
📧 *TEMPORARY EMAIL GENERATED*

✉️ *Email Address:*
${email}

⏳ *Expires:*
${timeString} • ${dateString}

🔑 *Session ID:*
\`\`\`${session_id}\`\`\`

📥 *Check Inbox:*
.inbox ${session_id}

_Email will expire after 24 hours_
`;

    await conn.sendMessage(
      from, {
        text: message,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363363023106228@newsletter',
            newsletterName: 'TempMail Service',
            serverMessageId: 101
          }
        }
      }, {
        quoted: mek
      }
    );

  } catch (e) {
    console.error('TempMail error:', e);
    reply(`❌ Error: ${e.message}`);
  }
});
cmd({
  pattern: "checkmail",
  alias: ["inbox", "tmail", "mailinbox"],
  desc: "Check your temporary email inbox",
  category: "utility",
  react: "📬",
  filename: __filename
},
async (conn, mek, m, {
  from,
  reply,
  args
}) => {
  try {
    const sessionId = args[0];
    if (!sessionId) return reply('🔑 Please provide your session ID\nExample: .checkmail YOUR_SESSION_ID');

    const inboxUrl = `https://apis.davidcyriltech.my.id/temp-mail/inbox?id=${encodeURIComponent(sessionId)}`;
    const response = await axios.get(inboxUrl);

    if (!response.data.success) {
      return reply('❌ Invalid session ID or expired email');
    }

    const {
      inbox_count,
      messages
    } = response.data;

    if (inbox_count === 0) {
      return reply('📭 Your inbox is empty');
    }

    let messageList = `📬 *You have ${inbox_count} message(s)*\n\n`;
    messages.forEach((msg, index) => {
      messageList += `━━━━━━━━━━━━━━━━━━\n` +
        `📌 *Message ${index + 1}*\n` +
        `👤 *From:* ${msg.from}\n` +
        `📝 *Subject:* ${msg.subject}\n` +
        `⏰ *Date:* ${new Date(msg.date).toLocaleString()}\n\n` +
        `📄 *Content:*\n${msg.body}\n\n`;
    });

    await reply(messageList);

  } catch (e) {
    console.error('CheckMail error:', e);
    reply(`❌ Error checking inbox: ${e.response?.data?.message || e.message}`);
  }
});


