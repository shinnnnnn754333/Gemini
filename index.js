const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Giữ bot sống trên Railway
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("Bot SAI DuckDuckGo Free dang chay!");
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

  // Khởi tạo lịch sử chat kiểu tin nhắn nối tiếp cho DuckDuckGo
  if (!chatHistories.has(userId)) {
    chatHistories.set(userId, [
      { role: "user", content: PERSONALITY + "\n\nHiểu rõ tính cách chưa? Trả lời ngắn gọn rồi bắt đầu chat." },
      { role: "assistant", content: "Được rồi ông nội, tao là SAI. Cứ nói chuyện kiểu mày tao tục tĩu đi, tao cân hết!" }
    ]);
  }
  
  const history = chatHistories.get(userId);
  history.push({ role: "user", content: userContent });

  try {
    await message.channel.sendTyping();
    
    // Gọi API qua proxy DuckDuckGo AI (Bản Llama-3-70b siêu thông minh)
    const response = await fetch('https://ai.fakeopen.com/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
        messages: history
      })
    });

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new Error("API đéo trả về chữ nào hết!");
    }

    const replyText = data.choices[0].message.content;
    
    history.push({ role: "assistant", content: replyText });
    
    if (history.length > 12) {
      history.splice(2, 2); 
    }

    message.reply(replyText);
  } catch (e) {
    console.error(e);
    message.reply("Đù má, hệ thống bất tử cũng lỗi: " + e.message);
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] Bot SAI (DuckDuckGo AI Free) sẵn sàng!`);
});

client.login(process.env.DISCORD_TOKEN);
