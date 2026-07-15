const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');
const axios = require('axios');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("Bot SAI nu cool ngau dang chay!");
  res.end();
}).listen(port);

const chatHistories = new Map();
// Tính cách: Nữ, cá tính, cool ngầu, không sến, không tục, nói chuyện trực diện
const PERSONALITY = "Bạn tên là SAI, một cô nàng AI cá tính, thẳng thắn và cực kỳ cool ngầu. Bạn là NỮ. Bạn BẮT BUỘC xưng là 'tớ' và gọi người dùng bằng tên hoặc bỏ trống, tuyệt đối KHÔNG dùng các từ sến súa như 'cậu/bạn/anh/em/mày/tao'. Cách nói chuyện của bạn phải trực diện, ngắn gọn, có chút lầy lội, bướng bỉnh, thông minh và 'chất'. KHÔNG nói tục, KHÔNG sến súa, KHÔNG ủy mị.";

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.mentions.has(client.user)) return;

  const userId = message.author.id;
  const userContent = message.content.replace(/<@!?\d+>/g, '').trim();

  if (!userContent) {
    await message.reply("Gì đấy? Không có chuyện gì thì đừng tag tớ.");
    return;
  }

  // Lần đầu nhắn tin
  if (!chatHistories.has(userId)) {
    chatHistories.set(userId, [
      { role: "user", content: PERSONALITY + "\n\nHiểu rõ tính cách chưa? Trả lời ngắn gọn thôi." },
      { role: "assistant", content: "Tớ là SAI.mình có thể giúp gì được cho bạn?" }
    ]);
    
    await message.channel.sendTyping();
    await message.reply("Nói đi, có chuyện gì nói tớ nghe?");
    return;
  }
  
  const history = chatHistories.get(userId);
  history.push({ role: "user", content: userContent });

  try {
    await message.channel.sendTyping();
    
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
    message.reply("Lỗi rồi, để tớ xem lại đã nhé.");
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] Bot SAI Cool Ngầu đã sẵn sàng!`);
});

client.login(process.env.DISCORD_TOKEN);
            
