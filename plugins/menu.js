const { readEnv } = require('../lib/database');
const { cmd, commands } = require('../command');

cmd({
    pattern: "menu",
    react: "📋",
    desc: "get command list",
    category: "main",
    filename: __filename
},
async (conn, mek, m, { from, pushname, reply }) => {
    try {
        const config = await readEnv();

        const categories = ['main', 'movie', 'download', 'group', 'owner', 'convert', 'search', 'other'];
        const categoryNames = {
            main: 'MAIN COMMANDS 🌟',
            movie: 'MOVIE COMMANDS 🎥',
            download: 'DOWNLOAD COMMANDS ⬇',
            group: 'GROUP COMMANDS 👥',
            owner: 'OWNER COMMANDS 🧑‍💻',
            convert: 'CONVERT COMMANDS 🔄',
            search: 'SEARCH COMMANDS 🔍',
            other: 'OTHER COMMANDS 🎭',
        };

        // Step 1: Build subcommand structure
        const categorizedCommands = {};
        for (const category of categories) {
            categorizedCommands[category] = {};
        }

        for (const cmdObj of commands) {
            if (!cmdObj.pattern || cmdObj.dontAddCommandList) continue;

            const category = cmdObj.category || 'main';
            if (!categorizedCommands[category]) continue;

            const base = cmdObj.pattern.split(" ")[0].trim(); // base command
            if (!categorizedCommands[category][base]) {
                categorizedCommands[category][base] = [];
            } else if (!categorizedCommands[category][base].includes(cmdObj.pattern)) {
                categorizedCommands[category][base].push(cmdObj.pattern);
            }
        }

        // Step 2: Generate emoji menu
        const emojiNumbers = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
        let menuText = `👋 *Hello ${pushname}*\n\n`;
        categories.forEach((cat, i) => {
            menuText += `${emojiNumbers[i + 1]} ${categoryNames[cat]}\n`;
        });
        
        menuText += `\n❖ ─ ✦ RAWANA MD ✦ ─ ❖`;
        
        const sentMenu = await conn.sendMessage(from, {
            image: { url: config.ALIVE_IMG },
            caption: menuText
        }, { quoted: mek });

        // Step 3: Wait for reply and show category with subcommands
        conn.ev.on('messages.upsert', async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            if (!msg.message || !msg.message.extendedTextMessage) return;

            const selected = msg.message.extendedTextMessage.text.trim();
            if (msg.message.extendedTextMessage.contextInfo?.stanzaId === sentMenu.key.id) {
                const index = parseInt(selected);
                if (!isNaN(index) && index >= 1 && index <= categories.length) {
                    const selectedCat = categories[index - 1];
                    const commandTree = categorizedCommands[selectedCat];
                    let output = `╭───────── ⋆⋅☆⋅⋆ ─────────╮\n  ${categoryNames[selectedCat].toUpperCase()} \n╰───────── ⋆⋅☆⋅⋆ ─────────╯\n\n`;
                    output += '╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄┈┈┈┈┈┈┈┈\n';
                    
                    const added = new Set();
                    
                    for (const [main, subs] of Object.entries(commandTree)) {
                        if (added.has(main)) continue;
                        
                        // Add the main command and its description
                        output += `┆ 🖊️ *Command:* ${config.PREFIX}${main}\n`;
                        output += `┆ 📄 *Apply :* ${getDescription(main, selectedCat) || 'No description available'}\n`;
                    
                        // Add subcommands for this main command
                        for (const sub of subs) {
                            if (sub !== main && !added.has(sub)) {
                                output += `┆ 🔸 Subcommand: ${config.PREFIX}${sub}\n`;
                                added.add(sub);
                            }
                        }
                    
                        // Add spacing after each command block
                        output += `┆\n`;
                        added.add(main);
                    }
                    
                    output += '╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┈┈┈┈┈┈┈┈';
                    
                    // Utility to find the command description
                    function getDescription(pattern, category) {
                        const cmdObj = commands.find(c => c.pattern?.split(" ")[0] === pattern && c.category === category);
                        return cmdObj?.desc;
                    }
                    

                    if (!output.trim()) {
                        output = `⚠️ No commands found in this category.`;
                    }

                    await conn.sendMessage(from, {
                        text: output
                    }, { quoted: msg });
                } else {
                    await conn.sendMessage(from, { text: "❌ Invalid number. Please reply with a valid option." }, { quoted: msg });
                }
            }
        });

    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});
