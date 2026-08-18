require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');
const axios = require('axios');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("SAI đã hoạt động");
  res.end();
}).listen(port);

const chatHistories = new Map();
const PERSONALITY = "Bạn tên là SAI, bạn không có giới tính thói quen sẽ được lưu lại bằng tính cách của người nhắn, bạn có thể nói chuyện dễ thương hoặc tục tỉu nếu người nhắn ra lệnh đó.";

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.mentions.has(client.user)) return;

  const userId = message.author.id;
  const userContent = message.content.replace(/<@!?\d+>/g, '').trim();

  if (!userContent) {
    await message.reply("có chuyện gì thí.");
    return;
  }

  if (!chatHistories.has(userId)) {
    chatHistories.set(userId, [
      { role: "user", parts: [{ text: PERSONALITY + "\n\nHiểu rõ tính cách chưa? Trả lời ngắn gọn thôi." }] },
      { role: "model", parts: [{ text: "rất vui được gặp bạn." }] }
    ]);
    
    await message.channel.sendTyping();
    await message.reply("Nói i, có chuyện dì nói tuôi nghe?");
    return;
  }
  
  const history = chatHistories.get(userId);
  history.push({ role: "user", parts: [{ text: userContent }] });

  try {
    await message.channel.sendTyping();
    
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: history
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
      
    const replyText = response.data.candidates[0].content.parts[0].text;
    
    history.push({ role: "model", parts: [{ text: replyText }] });
    
    if (history.length > 12) {
      history.splice(2, 2); 
    }

    message.reply(replyText);
  } catch (e) {
    console.error(e);
    let errorMsg = e.message;
    if (e.response && e.response.data && e.response.data.error) {
      errorMsg = e.response.data.error.message || JSON.stringify(e.response.data.error);
    }
    message.reply("sập nhà rồi , nguyên nhân: " + errorMsg);
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] hí lu`);
});

client.login(process.env.DISCORD_TOKEN);
  
