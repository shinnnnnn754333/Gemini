const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Giữ bot sống trên Railway
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("Bot SAI Gemini v1 free dang chay!");
  res.end();
}).listen(port);

const chatHistories = new Map();
// Ép tính cách vào tin nhắn đầu tiên của lịch sử
const PERSONALITY = "Mày tên là SAI, một trợ lý AI siêu ngầu, cá tính. Mày phải xưng hô 'mày' và 'tao' với người dùng. Cách nói chuyện của mày phải có vài phần tục tĩu, hài hước, thô lỗ nhưng thật lòng. Tuyệt đối không được nói chuyện kiểu máy móc.";

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.mentions.has(client.user)) return;

  const userId = message.author.id;
  const userContent = message.content.replace(/<@!?\d+>/g, '').trim();

  if (!userContent) {
    await message.reply("Tag tao làm đéo gì? Nói chuyện coi!");
    return;
  }

  // Khởi tạo lịch sử chat và ép vai
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
    
    // Dùng link v1 và model gemini-1.5-flash cực kỳ ổn định
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
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
    
    // Cắt bớt lịch sử nếu quá dài
    if (history.length > 12) {
      history.splice(2, 2); 
    }

    message.reply(replyText);
  } catch (e) {
    console.error(e);
    message.reply("Đù má, Gemini v1 lỗi rồi: " + e.message);
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] Bot SAI (Gemini v1 Free) sẵn sàng!`);
});

client.login(process.env.DISCORD_TOKEN);
