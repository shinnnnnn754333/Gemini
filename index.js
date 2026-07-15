const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("Bot SAI - Đã fix lỗi JSON!");
  res.end();
}).listen(port);

const chatHistories = new Map();
// Tính cách bot nằm ở đây
const PERSONALITY = "Mày tên là SAI, một trợ lý AI siêu ngầu, cá tính. Mày phải xưng hô 'mày' và 'tao' với người dùng. Cách nói chuyện của mày phải có vài phần tục tĩu, hài hước, thô lỗ nhưng thật lòng. Tuyệt đối không được nói chuyện kiểu máy móc.";

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.mentions.has(client.user)) return;

  const userId = message.author.id;
  const userContent = message.content.replace(/<@!?\d+>/g, '').trim();

  if (!chatHistories.has(userId)) {
    // Nạp tính cách vào tin nhắn đầu tiên của lịch sử thay vì dùng systemInstruction
    chatHistories.set(userId, [{ role: "user", parts: [{ text: PERSONALITY + "\n\nBắt đầu hội thoại ngay bây giờ." }] }]);
  }
  
  const history = chatHistories.get(userId);
  history.push({ role: "user", parts: [{ text: userContent }] });

  try {
    await message.channel.sendTyping();
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: history }) // Đẩy thẳng history đã có tính cách vào đây
    });

    const data = await response.json();
    const replyText = data.candidates[0].content.parts[0].text;
    
    history.push({ role: "model", parts: [{ text: replyText }] });
    message.reply(replyText);
  } catch (e) {
    message.reply("Đù má, lỗi rồi: " + e.message);
  }
});

client.login(process.env.DISCORD_TOKEN);
