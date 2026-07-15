const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');
const axios = require('axios');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("Bot SAI Groq dang chay sieu toc!");
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

  // Lần đầu nhắn tin thì kích hoạt câu chào hoạt động
  if (!chatHistories.has(userId)) {
    chatHistories.set(userId, [
      { role: "user", content: PERSONALITY + "\n\nHiểu rõ tính cách chưa? Trả lời ngắn gọn rồi bắt đầu chat." },
      { role: "assistant", content: "SAI đã hoạt động! Được rồi ông nội, tao là SAI. Cứ nói chuyện kiểu mày tao tục tĩu đi, tao cân hết!" }
    ]);
    
    await message.channel.sendTyping();
    await message.reply("SAI đã hoạt động! Kêu tao có việc gì đéo nói lẹ đi?");
    return;
  }
  
  const history = chatHistories.get(userId);
  history.push({ role: "user", content: userContent });

  try {
    await message.channel.sendTyping();
    
    // Đã đổi sang model Llama 3.3 70B Versatile chuẩn chỉ nhất của Groq
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: history,
        max_tokens: 500
      },
      {
        headers: { 
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    const replyText = response.data.choices[0].message.content;
    
    history.push({ role: "assistant", content: replyText });
    
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
    message.reply("Đù má, Groq lỗi rồi: " + errorMsg);
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] Bot SAI (Groq) sẵn sàng bốc lửa!`);
});

client.login(process.env.DISCORD_TOKEN);
