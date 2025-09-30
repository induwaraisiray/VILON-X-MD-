const { cmd } = require("../command");
const axios = require("axios");

cmd(
  {
    pattern: "ai",
    alias: ["chatgpt", "isira", "gpt4", "bot"],
    desc: "Chat with an AI model",
    category: "ai",
    react: "🤖",
    filename: __filename,
  },
  async (conn, m, msg, { from, args, q, reply, react }) => {
    try {
      if (!q)
        return reply(
          "Please provide a message for the AI.\nExample: `.ai Hello`"
        );

      const url =
        "https://lance-frank-asta.onrender.com/api/gpt?q=" +
        encodeURIComponent(q);

      const { data } = await axios.get(url);

      if (!data || !data.result) {
        await react("❌");
        return reply("AI failed to respond. Please try again later.");
      }

      await reply("🤖 *VILON-X-MD AI:*\n\n" + data.result);
      await react("✅");
    } catch (err) {
      console.error("Error in AI command:", err);
      await react("❌");
      reply("An error occurred while communicating with the AI.");
    }
  }
);

// OpenAI Command (.openai, .chatgpt, .gpt3, .open-gpt)
cmd(
  {
    pattern: "openai",
    alias: ["chatgpt", "gpt3", "open-gpt"],
    desc: "Chat with OpenAI",
    category: "ai",
    react: "🧠",
    filename: __filename,
  },
  async (conn, m, msg, { from, args, q, reply, react }) => {
    try {
      if (!q)
        return reply(
          "Please provide a message for OpenAI.\nExample: `.openai Hello`"
        );

      const url =
        "https://vapis.my.id/api/openai?q=" + encodeURIComponent(q);

      const { data } = await axios.get(url);

      if (!data || !data.result) {
        await react("❌");
        return reply("OpenAI failed to respond. Please try again later.");
      }

      await reply("🧠 *OpenAI Response:*\n\n" + data.result);
      await react("✅");
    } catch (err) {
      console.error("Error in OpenAI command:", err);
      await react("❌");
      reply("An error occurred while communicating with OpenAI.");
    }
  }
);

// DeepSeek AI Command (.deepseek, .seekai, .bing, .deep)
cmd(
  {
    pattern: "deepseek",
    alias: ["seekai", "bing", "deep"],
    desc: "Chat with DeepSeek AI",
    category: "ai",
    react: "🧠",
    filename: __filename,
  },
  async (conn, m, msg, { from, args, q, reply, react }) => {
    try {
      if (!q)
        return reply(
          "Please provide a message for DeepSeek AI.\nExample: `.deepseek Hello`"
        );

      const url =
        "https://api.ryzendesu.vip/api/ai/deepseek?text=" +
        encodeURIComponent(q);

      const { data } = await axios.get(url);

      if (!data || !data.answer) {
        await react("❌");
        return reply("DeepSeek AI failed to respond. Please try again later.");
      }

      await reply("🧠 *DeepSeek AI Response:*\n\n" + data.answer);
      await react("✅");
    } catch (err) {
      console.error("Error in DeepSeek AI command:", err);
      await react("❌");
      reply("An error occurred while communicating with DeepSeek AI.");
    }
  }
);