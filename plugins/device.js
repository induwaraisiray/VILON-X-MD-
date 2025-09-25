const config = require('../config');
const { cmd } = require('../command');
const fs = require("fs");
const path = require("path");
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')

cmd({
    pattern: "device",
    react: "📱",
    alias: ["getdevice"],
    desc: "Check Use Whatsapp",
    category: "owner",
    use: '.device',
    filename: __filename
},
async(conn, mek, m,{from, l, quoted, body, isCmd, command, args, q, msr, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator ,isDev, isAdmins, reply}) => {
try{
    
if ( !isDev && !isOwner && !isMe ) return await reply(msr.own_cmd)
if ( !m.quoted ) return reply('*Please reply a Message... ❗*')
  
if (m.quoted.id.startsWith("3A")) {
  var ss= '```'
 conn.sendMessage(from, { 
      text : `@${m.quoted.sender.split('@')[0]}  *Is Using:* ${ss}Ios WhatsApp(i Phone)${ss}`, 
      mentions : [m.quoted.sender]
    });
} else if (m.quoted.id.startsWith("3EB")) {
  var ss= '```'
 conn.sendMessage(from, { 
      text : `@${m.quoted.sender.split('@')[0]}  *Is Using:* ${ss}Web WhatsApp${ss}`, 
      mentions : [m.quoted.sender]
    });
} else if (m.quoted.id.startsWith("BAE")) {
  var ss= '```'
 conn.sendMessage(from, { 
      text : `@${m.quoted.sender.split('@')[0]}  *Is Using:* ${ss}Web WhatsApp(Wiskeysockets/Baileys-WA-Web-Api)${ss}`, 
      mentions : [m.quoted.sender]
    });
} else if (m.quoted.id.startsWith("QUEENAMDI")) {
  var ss= '```'
 conn.sendMessage(from, { 
      text : `@${m.quoted.sender.split('@')[0]}  *Is Using:* ${ss}Web WhatsApp(QueenAmdi-Wa-Bot)${ss}`, 
      mentions : [m.quoted.sender]
    });
  } else if (m.quoted.id.startsWith("TAIFUR2")) {
  var ss= '```'
 conn.sendMessage(from, { 
      text : `@${m.quoted.sender.split('@')[0]}  *Is Using:* ${ss}Web WhatsApp(Taifur-X-Wa-Bot)${ss}`, 
      mentions : [m.quoted.sender]
    });
} else if (m.quoted.id.startsWith("ZEROTWO")) {
  var ss= '```'
 conn.sendMessage(from, { 
      text : `@${m.quoted.sender.split('@')[0]}  *Is Using:* ${ss}Web WhatsApp(ZeroTwo-Md-Wa-Bot)${ss}`, 
      mentions : [m.quoted.sender]
    });
} else {
  var ss= '```'
 conn.sendMessage(from, { 
      text : `@${m.quoted.sender.split('@')[0]}  *Is Using:* ${ss}Android WhatsApp ${ss}`, 
      mentions : [m.quoted.sender]
    });
}
} catch (e) {
await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
console.log(e)
reply(`❌ *Error Accurated !!*\n\n${e}`)
}
})

//========================================GET-ID COMMAND================================================

cmd({
    pattern: "id",
    react: "📲",
    alias: ["getdeviceid"],
    desc: "Get message id",
    use: '.id',
    filename: __filename
},
async(conn, mek, m,{from, l, quoted, body, isCmd, msr, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator ,isDev, isAdmins, reply}) => {
try{
if ( !isDev && !isOwner && !isMe ) return await reply(msr.own_cmd)
    
if ( !m.quoted ) return reply('*Please reply a Message... ❗*')
reply(m.quoted.id)
} catch (e) {
await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
console.log(e)
reply(`❌ *Error Accurated !!*\n\n${e}`)
}
})

