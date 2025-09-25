const { cmd } = require("../command");
const yts = require("yt-search");
const axios = require("axios");
const ddownr = require('denethdev-ytmp3');

cmd(
  {
    pattern: "video",
    react: "🎥",
    desc: "Download YouTube Video",
    category: "download",
    filename: __filename,
  },
async (messageHandler, context, quotedMessage, { from, reply, q }) => {
try{
      if (!q) return reply("*Please give me url or title* ❓");

      // Search for the video
      const search = await yts(q);
      const data = search.videos[0];
      const url = data.url;

      // Video metadata description
      let desc = ` 
╔══════════════════╗  
║ 𝗩𝗜𝗗𝗘𝗢 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥 🎥               
╠══════════════════╣  
║ 🎥 Title: ${data.title}                                                                                                 
║ ⏳ Duration: ${data.timestamp}                                                                                   
║ 📊 Views: ${data.views}                                                      
║ 📅 Uploaded: ${data.ago}
║ 🖊 Author: ${data.author.name}                                                                                                           
║ 🔗 Watch Now: ${data.url} 
║     
║ *Select Download Format:*
║ *1 ||* Video File  🎶
║ *2 ||* Document File  📂                               
╠══════════════════╣  
║    ❖ ─ ✦ RAWANA MD ✦ ─ ❖         
╚══════════════════╝                                                                                                                                                              
`;

      // Send metadata and thumbnail message
      const sentMessage = await messageHandler.sendMessage(from,
        { image: { url: data.thumbnail }, caption: desc },
        { quoted: quotedMessage }
      );
  
      // Video download function
      const downloadVideo = async (url, quality) => {
        const apiUrl = `https://p.oceansaver.in/ajax/download.php?format=${quality}&url=${encodeURIComponent(
          url
        )}&api=dfcb6d76f2f6a9894gjkege8a4ab232222`;
        const response = await axios.get(apiUrl);

        if (response.data && response.data.success) {
          const { id, title } = response.data;

          // Wait for download URL generation
          const progressUrl = `https://p.oceansaver.in/ajax/progress.php?id=${id}`;
          while (true) {
            const progress = await axios.get(progressUrl);
            if (progress.data.success && progress.data.progress === 1000) {
              const videoBuffer = await axios.get(progress.data.download_url, {
                responseType: "arraybuffer",
              });
              return { buffer: videoBuffer.data, title };
            }
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }
        } else {
          throw new Error("Failed to fetch video details.");
        }
      };

      // Specify desired quality (default: 720p)
      const quality = "720";
      const video = await downloadVideo(url, quality);

      // Listen for the user's reply to select the download format
        messageHandler.ev.on("messages.upsert", async (update) => {
      const message = update.messages[0];
      if (!message.message || !message.message.extendedTextMessage) return;

      const userReply = message.message.extendedTextMessage.text.trim();
  
     // Handle the download format choice
     if (message.message.extendedTextMessage.contextInfo.stanzaId === sentMessage.key.id) {
    // React to the user’s reply message directly
     await messageHandler.sendMessage(from, { 
        react: { text: "⬆️", key: message.key } 
      });
      switch (userReply) {
        case '1': // video File
          await messageHandler.sendMessage(from, {
            video: video.buffer,
            caption: `\n❖ ─ ✦ RAWANA MD ✦ ─ ❖`,
          }, { quoted: quotedMessage });
     // Change the reaction to once the file upload is complete
      await messageHandler.sendMessage(from, { 
        react: { text: "✅", key: message.key } 
      });
          break;
        case '2': // Document video File
          await messageHandler.sendMessage(from, {
            document: video.buffer,
            mimetype: "video/mp4",
            fileName: `${data.title}.mp4`,
            caption: "❖ ─ ✦ RAWANA MD ✦ ─ ❖",
          }, { quoted: quotedMessage });
    // Change the reaction to once the file upload is complete
       await messageHandler.sendMessage(from, { 
        react: { text: "✅", key: message.key } 
      });
          break;
        default:
          reply("*Invalid Option. Please Select A Valid Option 🙄*");
          break;
        }
     }
    });
    } catch (e) {
      console.error(e);
      reply(`❌ Error: ${e.message}`);
    }
  }
);

//====================================AUDIO-DOWNLOAD=====================================

cmd({
  pattern: "song",
  desc: "Download songs.",
  category: "download",
  react: '🎧',
  filename: __filename
}, async (messageHandler, context, quotedMessage, { from, reply, q }) => {
  try {
    if (!q) return reply("*Please give me url or title* ❓");
    
    // Search for the song using yt-search
    const searchResults = await yts(q);
    if (!searchResults || searchResults.videos.length === 0) {
      return reply("*No Song Found Matching Your Query 🧐*");
    }

    const songData = searchResults.videos[0];
    const songUrl = songData.url;

    // Using denethdev-ytmp3 to fetch the download link
    const result = await ddownr.download(songUrl, 'mp3'); // Download in mp3 format
    const downloadLink = result.downloadUrl; // Get the download URL
    
         let songDetailsMessage = `
    ╔══════════════════╗  
    ║ 𝗔𝗨𝗗𝗜𝗢 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥 🎵               
    ╠══════════════════╣  
    ║ 🎵 Title: ${songData.title}                                                                                                     
    ║ ⏳ Duration: ${songData.timestamp}                                                                                  
    ║ 📊 Views: ${songData.views}                                                       
    ║ 📅 Uploaded: ${songData.ago}
    ║ 🖊 Author: ${songData.author.name}                                                                                                           
    ║ 🔗 Watch Now: ${songData.url}  
    ║
    ║ *Select Download Format:*
    ║ *1 ||* Audio File  🎶
    ║ *2 ||* Document File  📂
    ╠══════════════════╣  
    ║    ❖ ─ ✦ RAWANA MD ✦ ─ ❖          
    ╚══════════════════╝  
    `;
    // Send the video thumbnail with song details
    const sentMessage = await messageHandler.sendMessage(from, {
      image: { url: songData.thumbnail },
      caption: songDetailsMessage,
    }, { quoted: quotedMessage });

    // Listen for the user's reply to select the download format
    messageHandler.ev.on("messages.upsert", async (update) => {
      const message = update.messages[0];
      if (!message.message || !message.message.extendedTextMessage) return;

      const userReply = message.message.extendedTextMessage.text.trim();

      // Handle the download format choice
      if (message.message.extendedTextMessage.contextInfo.stanzaId === sentMessage.key.id) {
      // React to the user’s reply message directly
      await messageHandler.sendMessage(from, { 
         react: { text: "⬆️", key: message.key } 
        });
        switch (userReply) {
          case '1': // Audio File
            await messageHandler.sendMessage(from, {
              audio: { url: downloadLink },
              mimetype: "audio/mpeg"
            }, { quoted: quotedMessage });
            
      // Change the reaction to once the file upload is complete
        await messageHandler.sendMessage(from, { 
          react: { text: "✅", key: message.key } 
        });
            break;
          case '2': // Document File
            await messageHandler.sendMessage(from, {
              document: { url: downloadLink },
              mimetype: 'audio/mpeg',
              fileName: `${songData.title}.mp3`,
              caption: `❖ ─ ✦ RAWANA MD ✦ ─ ❖`
            }, { quoted: quotedMessage });
      // Change the reaction to once the file upload is complete
        await messageHandler.sendMessage(from, { 
          react: { text: "✅", key: message.key } 
        });
            break;
          default:
            reply("*Invalid Option. Please Select A Valid Option 🙄*");
            break;
        }
      }
    });
    } catch (e) {
      console.log(e);
      reply(`❌ Error: ${e.message}`);
    }
  }
);
