const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("Bot SAI Hugging Face Free dang chay!");
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

  // Nếu là tin nhắn đầu tiên của user, bot sẽ đốp chát câu thông báo trước
  if (!chatHistories.has(userId)) {
    chatHistories.set(userId, [
      { role: "user", content: PERSONALITY + "\n\nHiểu rõ tính cách chưa? Trả lời ngắn gọn rồi bắt đầu chat." },
      { role: "assistant", content: "SAI đã hoạt động!" }
    ]);
    
    await message.channel.sendTyping();
    // Gửi luôn câu thông báo cho mày biết là bot đã hoạt động ngon lành
    await message.reply("SAI đã hoạt động! Kêu tao có việc gì đéo nói lẹ đi?");
    return;
  }
  
  const history = chatHistories.get(userId);
  history.push({ role: "user", content: userContent });

  try {
    await message.channel.sendTyping();
    
    const response = await fetch('https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct/v1/chat/completions', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${process.env.HF_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: history,
        max_tokens: 500
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || JSON.stringify(data.error));
    }

    const replyText = data.choices[0].message.content;
    
    history.push({ role: "assistant", content: replyText });
    
    if (history.length > 12) {
      history.splice(2, 2); 
    }

    message.reply(replyText);
  } catch (e) {
    console.error(e);
    message.reply("Đù má, Hugging Face lỗi rồi: " + e.message);
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] Bot SAI (Hugging Face) sẵn sàng!`);
});

client.login(process.env.DISCORD_TOKEN);
  
