const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("Bot SAI Gemini 2.0 Free dang chay!");
  res.end();
}).listen(port);

const chatHistories = new Map();
const PERSONALITY = "Mày tên là SAI, một trợ lý AI siêu ngầu, cá tính. Mày phải xưng hô 'mày' và 'tao' với người dùng. Cách nói chuyện của mày phải có vài phần tục tĩu, hài hước, thô lỗ nhưng thật lòng. Tuyệt đối không được nói chuyện kiểu máy móc.";

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.mentions.has(client.user)) return;

  const userId = message.author.id;
  const userContent = message.content.replace(/<@!?\d+>/g, '').trim();

  if (!userContent) {
    await message.reply("Tag tao làm đéo gì? Nói chuyện coi!");
    return;
  }

  if (!chatHistories.has(userId)) {
    chatHistories.set(userId, [
      { role: "user", parts: [{ text: PERSONALITY + "\n\nHiểu rõ tính cách chưa? Trả lời ngắn gọn rồi bắt đầu chat." }] },
      { role: "model", parts: [{ text: "Được rồi ông nội, tao là SAI. Cứ nói chuyện kiểu mày tao tục tĩu đi, tao cân hết!" }] }
    ]);
  }
  
  const history = chatHistories.get(userId);
  history.push({ role: "user", parts: [{ text: userContent }] });

  try {
    await message.channel.sendTyping();
    
    // Sử dụng gemini-2.0-flash chuẩn xác cho key AQ mới
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: history })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const replyText = data.candidates[0].content.parts[0].text;
    
    history.push({ role: "model", parts: [{ text: replyText }] });
    
    if (history.length > 12) {
      history.splice(2, 2); 
    }

    message.reply(replyText);
  } catch (e) {
    console.error(e);
    message.reply("Đù má, Gemini lỗi rồi: " + e.message);
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] Bot SAI (Gemini 2.0) sẵn sàng!`);
});

client.login(process.env.DISCORD_TOKEN);
      
