const { cmd } = require("../command");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const Crypto = require("crypto");

cmd({
  pattern: "image2url",
  react: "⏭️",
  alias: ["img2url"],
  desc: "Uploads replied image to ImgBB",
  use: ".imgbb <reply to an image>",
  category: "convert",
  filename: __filename
}, async (conn, mek, m, { from, quoted, reply, sender, isOwner, isGroup, isAdmins }) => {
  let tempFilePath = "";
  try {
    await conn.sendMessage(from, { react: { text: '📎', key: mek.key } });

    if (!quoted || !quoted.msg || !quoted.msg.url || !quoted.type.includes("image")) {
      return reply("Please reply to an image to upload it to ImgBB.");
    }

    const tempFileName = `VILON_X_MD_${Crypto.randomBytes(8).toString("hex")}.jpg`;
    tempFilePath = path.resolve(tempFileName);

    const mediaBuffer = await quoted.download();
    if (!mediaBuffer) return reply("Failed to download the image. Please try again.");

    fs.writeFileSync(tempFilePath, mediaBuffer);
    if (!fs.existsSync(tempFilePath)) return reply("Image file could not be found after download.");

    const apiKey = "5ee1798146ca754423744e7ef0ceeeb8";
    const formData = new FormData();
    formData.append("image", fs.createReadStream(tempFilePath));

    const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData, {
      headers: formData.getHeaders()
    });

    fs.unlinkSync(tempFilePath);

    if (response.data && response.data.success) {
      const imageUrl = response.data.data.url;
      reply(`✅ Image uploaded successfully!\n🌐 URL: ${imageUrl}`);
    } else {
      reply("❌ Failed to upload the image to ImgBB. Please try again.");
    }

  } catch (error) {
    console.error("Error uploading image to ImgBB:", error);
    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    reply("❌ An error occurred while uploading the image.");
  }
});

//===============================REMOVE-IMAGE-BACKGROUND=================================

cmd({
  pattern: "removebg",
  alias: ["rbg", "nobg", "transparent"],
  use: ".removebg (reply to image)",
  react: "💱",
  desc: "Remove image background",
  category: "convert",
  filename: __filename
},
async (conn, m, mek, { from, reply, tr }) => {
  try {
      let target = m.quoted ? m.quoted : m;

      const isImage = () => {
          if (target.imageMessage) return true;
          if (target.msg?.imageMessage) return true;
          if (target.mimetype?.startsWith('image/')) return true;
          if (target.msg?.mimetype?.startsWith('image/')) return true;
          return false;
      };

      if (!isImage()) {
          return await reply(await tr("*Please reply to an image!*"));
      }

      await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

      const imageBuffer = await target.download();
      const base64Image = imageBuffer.toString('base64');

      const response = await axios.post(
          "https://us-central1-ai-apps-prod.cloudfunctions.net/restorePhoto", 
          {
              image: `data:image/png;base64,${base64Image}`,
              model: "fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
          }
      );

      const resultUrl = response.data?.replace(/"/g, '');
      if (!resultUrl) {
          throw new Error("Background removal failed");
      }

      await conn.sendMessage(
          from,
          {
              image: { url: resultUrl },
              caption: "Background removed by RAWANA MD"
          },
          { quoted: mek }
      );

      await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

  } catch (e) {
      console.error('Error in removebg command:', e);
      await reply(await tr("Error occurred while removing background!"));
      await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
  }
});
