const config = require('../config');
const { cmd } = require('../command');
const {
  fetchJson,
  resizeImage
} = require("../lib/functions");

cmd({
  pattern: "requests",
  desc: "View pending join requests",
  react: '📝',
  category: 'group',
  filename: __filename
}, async (conn, msg, m, { from, isGroup, reply }) => {
  if (!isGroup) return reply("❌ Group only.");

  const meta = await conn.groupMetadata(from);
  const isBotAdmin = meta.participants.some(p => p.id === conn.user.id && p.admin);
  if (!isBotAdmin) return reply("❌ I'm not an admin.");

  const pending = await conn.groupRequestParticipantsList(from);
  if (pending.length === 0) return reply("No pending requests.");

  let text = "📋 *Pending Join Requests:*\n\n";
  pending.forEach((u, i) => {
    text += `${i + 1}. @${u.jid.split('@')[0]}\n`;
  });

  reply(text, { mentions: pending.map(u => u.jid) });
});

/**
 * Accept requests
 */
cmd({
  pattern: "accept",
  desc: "Accept join requests",
  use: ".accept <numbers>",
  react: '✔️',
  category: "group",
  filename: __filename
}, async (conn, msg, m, { from, isGroup, reply, match }) => {
  if (!isGroup) return reply("❌ Group only.");
  const meta = await conn.groupMetadata(from);
  const isBotAdmin = meta.participants.some(p => p.id === conn.user.id && p.admin);
  if (!isBotAdmin) return reply("❌ I'm not an admin.");

  const pending = await conn.groupRequestParticipantsList(from);
  if (pending.length === 0) return reply("No pending requests.");
  if (!match) return reply("Give request numbers separated by commas.");

  const indexes = match.split(',').map(n => parseInt(n.trim()) - 1);
  const valid = indexes.filter(i => i >= 0 && i < pending.length);

  if (valid.length === 0) return reply("Invalid numbers.");
  for (let i of valid) {
    await conn.groupRequestParticipantsUpdate(from, [pending[i].jid], "approve");
  }
  reply(`✔️ Accepted ${valid.length} request(s).`);
});

/**
 * Reject requests
 */
cmd({
  pattern: "reject",
  desc: "Reject join requests",
  use: ".reject <numbers>",
  react: '❌',
  category: "group",
  filename: __filename
}, async (conn, msg, m, { from, isGroup, reply, match }) => {
  if (!isGroup) return reply("❌ Group only.");
  const meta = await conn.groupMetadata(from);
  const isBotAdmin = meta.participants.some(p => p.id === conn.user.id && p.admin);
  if (!isBotAdmin) return reply("❌ I'm not an admin.");

  const pending = await conn.groupRequestParticipantsList(from);
  if (pending.length === 0) return reply("No pending requests.");
  if (!match) return reply("Give request numbers separated by commas.");

  const indexes = match.split(',').map(n => parseInt(n.trim()) - 1);
  const valid = indexes.filter(i => i >= 0 && i < pending.length);

  if (valid.length === 0) return reply("Invalid numbers.");
  for (let i of valid) {
    await conn.groupRequestParticipantsUpdate(from, [pending[i].jid], "reject");
  }
  reply(`❌ Rejected ${valid.length} request(s).`);
});

/**
 * Hidetag (mention all silently)
 */
cmd({
  pattern: "hidetag",
  desc: "Mention all group members without showing tags",
  react: '📢',
  category: "group",
  filename: __filename
}, async (conn, msg, m, { from, isGroup, isAdmins, reply, args }) => {
  if (!isGroup) return reply("❌ Group only.");
  if (!isAdmins) return reply("❌ Admin only.");

  const meta = await conn.groupMetadata(from);
  const members = meta.participants.map(u => u.id);

  await conn.sendMessage(from, {
    text: args.join(" ") || "",
    mentions: members
  });
});

/**
 * Kick
 */
cmd({
  pattern: "kick",
  desc: "Remove members",
  use: ".kick @user",
  react: '👢',
  category: "group",
  filename: __filename
}, async (conn, msg, m, { from, isGroup, isAdmins, isBotAdmins, reply, mentionedJid }) => {
  if (!isGroup) return reply("❌ Group only.");
  if (!isAdmins) return reply("❌ Admin only.");
  if (!isBotAdmins) return reply("❌ I need to be admin.");

  if (!mentionedJid[0]) return reply("Tag user(s) to kick.");
  for (let u of mentionedJid) {
    await conn.groupParticipantsUpdate(from, [u], "remove");
  }
  reply("👢 User(s) removed.");
});

/**
 * Promote
 */
cmd({
  pattern: "promote",
  desc: "Make user an admin",
  react: '⬆️',
  category: "group",
  filename: __filename
}, async (conn, msg, m, { from, isGroup, isAdmins, isBotAdmins, reply, mentionedJid }) => {
  if (!isGroup) return reply("❌ Group only.");
  if (!isAdmins) return reply("❌ Admin only.");
  if (!isBotAdmins) return reply("❌ I need to be admin.");

  if (!mentionedJid[0]) return reply("Tag user(s) to promote.");
  for (let u of mentionedJid) {
    await conn.groupParticipantsUpdate(from, [u], "promote");
  }
  reply("⬆️ User(s) promoted.");
});

/**
 * Demote
 */
cmd({
  pattern: "demote",
  desc: "Remove admin role",
  react: '⬇️',
  category: "group",
  filename: __filename
}, async (conn, msg, m, { from, isGroup, isAdmins, isBotAdmins, reply, mentionedJid }) => {
  if (!isGroup) return reply("❌ Group only.");
  if (!isAdmins) return reply("❌ Admin only.");
  if (!isBotAdmins) return reply("❌ I need to be admin.");

  if (!mentionedJid[0]) return reply("Tag user(s) to demote.");
  for (let u of mentionedJid) {
    await conn.groupParticipantsUpdate(from, [u], "demote");
  }
  reply("⬇️ User(s) demoted.");
});

/**
 * Mute Group
 */
cmd({
  pattern: "mute",
  desc: "Mute group (only admins can chat)",
  react: '🔇',
  category: "group",
  filename: __filename
}, async (conn, msg, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
  if (!isGroup) return reply("❌ Group only.");
  if (!isAdmins) return reply("❌ Admin only.");
  if (!isBotAdmins) return reply("❌ I need to be admin.");

  await conn.groupSettingUpdate(from, "announcement");
  reply("🔇 Group muted.");
});

/**
 * Unmute Group
 */
cmd({
  pattern: "unmute",
  desc: "Unmute group (all members can chat)",
  react: '🔊',
  category: "group",
  filename: __filename
}, async (conn, msg, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
  if (!isGroup) return reply("❌ Group only.");
  if (!isAdmins) return reply("❌ Admin only.");
  if (!isBotAdmins) return reply("❌ I need to be admin.");

  await conn.groupSettingUpdate(from, "not_announcement");
  reply("🔊 Group unmuted.");
});

/**
 * Join Group (by link)
 */
cmd({
  pattern: "join",
  desc: "Join a group by invite link",
  use: ".join <link>",
  react: '🔗',
  category: "group",
  filename: __filename
}, async (conn, msg, m, { q, reply }) => {
  if (!q) return reply("Give me a group link.");
  const code = q.split("https://chat.whatsapp.com/")[1];
  await conn.groupAcceptInvite(code);
  reply("✅ Joined the group.");
});

/**
 * Delete Message
 */
cmd({
  pattern: "del",
  desc: "Delete quoted message",
  react: '🗑️',
  category: "group",
  filename: __filename
}, async (conn, msg, m, { reply }) => {
  if (!msg.quoted) return reply("Reply to a message to delete it.");
  await conn.sendMessage(msg.chat, {
    delete: {
      remoteJid: msg.chat,
      fromMe: msg.quoted.fromMe,
      id: msg.quoted.id,
      participant: msg.quoted.sender
    }
  });
});

/**
 * Leave Group
 */
cmd({
  pattern: "leave",
  desc: "Bot leaves the group",
  react: '🚪',
  category: "group",
  filename: __filename
}, async (conn, msg, m, { from, isGroup, isAdmins, reply }) => {
  if (!isGroup) return reply("❌ Group only.");
  if (!isAdmins) return reply("❌ Admin only.");
  await conn.groupLeave(from);
});
