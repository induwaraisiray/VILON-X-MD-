const {cmd , commands} = require('../command')
const axios = require("axios")
const config = require('../config');

const GEMINI_API_KEY = 'AIzaSyC8pSIvRTtYS-ZghDZWWPUY360gEFB37hM';  //REPLACE WITH YOUR API KEY OF GEMINI
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

cmd({
  pattern: "ai",
  alias: ["gemini","chatgpt"],
  react: '🤖',
  desc: "Ask anything to Google Gemini AI.",
  category: "main",
  use: ".gemini <Your Quoestion>",
  filename: __filename
}, async (conn, mek, msg, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
  try {
    const text = args.join(" ");
    if (!text) {
      return reply(`❗️ Please Give Me A Question`);
    }

    const prompt = `my name is ${pushname}, Your name is VILON-X-MD AI. you are a WhatsApp AI Bot. you were made by FRAMEXTEAM. answer in the language the person talking to you speak. Answer in a way that doesn't sound like you're a bot. think you are human and answer. Use meaningful emojis. my question is: ${text}`;

    const payload = {
      contents: [{
        parts: [{ text: prompt }]
      }]
    };

    const response = await axios.post(
      GEMINI_API_URL,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data || !response.data.candidates || !response.data.candidates[0]?.content?.parts) {
      return reply("❌ error in the answer.");
    }
    
    const aiResponse = response.data.candidates[0].content.parts[0].text;
    await reply(`${aiResponse}`);
  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
    reply("❌ Error in the quation");
  }
});
