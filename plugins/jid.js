const { cmd } = require('../command');
const mimeType = require('mime-types');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions');

cmd({
    pattern: "jid",
    alias: ["getjid", "chatjid"],
    desc: "Get current chat's raw JID",
    category: "owner",
    use: '.jid',
    filename: __filename
},
async(conn, mek, m, { from, reply }) => {
    try {
        // Send ONLY the JID without any additional text
        await reply(from);
    } catch (e) {
        console.error("Error in jid command:", e);
        await reply("❌ Error fetching chat JID");
    }
});

//===========================FORWARD-COMMAND====================================

cmd({
  pattern: "forward",
  react: "⏩",
  desc: "Forward a replied message to one or more JIDs",
  alias: ["f", "fw"],
  category: "owner",
  use: ".forward <jid1 , jid2 , ...>",
  filename: __filename
}, async (conn, mek, m, { q, quoted, reply }) => {
  if (!q || !quoted) {
    return reply("❌ Please reply to a message and provide at least one JID.");
  }

  const jids = q.split(",").map(j => j.trim()).filter(Boolean);
  if (!jids.length) return reply("⚠ Please provide valid JIDs.");

  const original = quoted.fakeObj;

  let results = [];

  for (const jid of jids) {
    try {
      await conn.relayMessage(jid, original.message, { messageId: generateMessageID() });
      results.push(`${jid}`);
    } catch (err) {
      results.push(`${jid}`);
      console.error(`Forward error for ${jid}:`, err);
    }
  }

  const final = results.join("\n");
  return reply(`*✅ Forwarding Results:*\n\n${final}`);
});

function generateMessageID() {
  return Math.floor(Math.random() * 1e12).toString();
}
