const { cmd } = require("../command");
const axios = require("axios"); // Install axios: npm install axios
const config = require("../config");

const API_URL = "https://facebook-downloader.apis-bj-devs.workers.dev/"; // Current API URL

cmd(
  {
    pattern: "fb1",
    alias: ["facebook"],
    react: "🎬",
    category: "download",
    desc: "Download Facebook videos (HD or SD) with thumbnail and extra info",
    filename: __filename,
  },
  async (
    robin,
    m,
    mek,
    { from, q, reply }
  ) => {
    try {
      console.log("Received Facebook URL:", q);

      if (!q || q.trim() === "") {
        console.log("No URL provided by user");
        return await reply("*🎬 Please provide a valid Facebook video URL!* ⚡");
      }

      const fbRegex = /(https?:\/\/)?(www\.)?(facebook|fb|m\.facebook|fb\.watch)\.com\/(?:(?:share|videos|watch|video|reel|post|live|stories|groups)\/.+|(?:u\/\d+|user\/\d+|profile\.php\?id=\d+)|(?:photo\.php\?fbid=\d+)|(?:permalink\.php\?story_fbid=\d+&id=\d+))+/i;
      if (!fbRegex.test(q)) {
        console.log("Invalid Facebook URL provided:", q);
        return await reply("*❌ Invalid Facebook URL! Please provide a valid link (e.g., facebook.com/videos, fb.watch, facebook.com/share, etc.).* ❄️");
      }

      await reply("*⏳ Fetching video details, please wait...* ❄️");

      const apiUrl = `${API_URL}?url=${encodeURIComponent(q)}`;
      console.log("API Request URL:", apiUrl);

      const response = await axios.get(apiUrl, { timeout: 15000 });

      console.log("API Response:", JSON.stringify(response.data, null, 2));

      if (!response.data) {
        console.log("No API response received");
        return await reply("*❌ No response from API. The service might be down. Try again later.* ❄️");
      }

      const apiStatus = response.data.status === true;

      if (!apiStatus) {
        console.log("API reported failure, Response:", response.data);
        let errorMsg = "*❌ Failed to fetch video details.* ⚡";
        if (response.data.message) {
          errorMsg += `\nReason: ${response.data.message}`;
        } else {
          errorMsg += "\nThe video might be private, restricted, or the URL is invalid. Please check the URL and try again.";
        }
        return await reply(errorMsg);
      }

      const videoData = {
        ...response.data.data,
        poweredBy: "Frozen MD",
        status: apiStatus
      };

      console.log("Video Data:", JSON.stringify(videoData, null, 2));

      if (videoData.url) {
        console.log("Single video found, URL:", videoData.url);

        let caption = `*🎬 Facebook Video*\n`;
        let videoUrlToSend = videoData.url; // Default to HD or available quality

        // Check if SD quality is available (assuming API might return multiple qualities)
        if (videoData.qualities && Array.isArray(videoData.qualities)) {
          const sdQuality = videoData.qualities.find(q => q.quality === "SD");
          if (sdQuality && sdQuality.url) {
            videoUrlToSend = sdQuality.url; // Use SD if available
            caption += `📌 Quality: SD\n`;
          } else if (videoData.quality) {
            caption += `📌 Quality: ${videoData.quality}\n`;
          }
        } else if (videoData.quality) {
          caption += `📌 Quality: ${videoData.quality}\n`;
        }

        caption += `ᴩᴏᴡᴇʀᴅ ʙʏ ᴠɪʟᴏɴ-x-ᴍᴅ`;

        if (videoData.thumbnail) {
          await robin.sendMessage(
            from,
            {
              image: { url: videoData.thumbnail },
              caption: "*🎬 Facebook Video Thumbnail*\n⏳ Video will be sent next...* ®",
            },
            { quoted: mek }
          );
        }

        await robin.sendMessage(
          from,
          {
            video: { url: videoUrlToSend },
            caption: caption,
          },
          { quoted: mek }
        );
      } else {
        console.log("No video URL found in response:", response.data);
        return await reply("*❌ No video URL found in the response. The video might be private or not available.* ⚡");
      }

    } catch (e) {
      console.error("Error downloading FB video:", e.message, e.stack);
      if (e.code === "ECONNABORTED") {
        return await reply("*❌ Timeout: The server took too long to respond. Please try again later.* ⚡");
      } else if (e.response && e.response.data) {
        return await reply(`*❌ Error:* ${e.response.data.message || "API error occurred. Try again later."} ⚡`);
      } else {
        return await reply(`*❌ Error:* ${e.message || "Something went wrong while downloading the video. Try again later."} ⚡`);
      }
    }
  }
);

// Handle button response (removed since we are handling single video directly now)
cmd(
  {
    pattern: "fb_quality",
    dontAddCommandList: true, // Hide from command list
  },
  async (
    robin,
    mek,
    m,
    { from, reply }
  ) => {
    try {
      console.log("Button interaction received for user:", m.sender, "Button ID:", m.id);
      await reply("*❌ This command is no longer needed. Use !fb directly with the video URL.* ❄️");

    } catch (e) {
      console.error("Error in fb_quality command:", e.message, e.stack);
      await reply("*❌ Error processing your request. Please try again.* ❄️");
    }
  }
);
