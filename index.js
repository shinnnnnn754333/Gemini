const { Client, GatewayIntentBits } = require('discord.js');
const http = require('http');
const axios = require('axios');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("Bot SAI nu dang yeu dang chay!");
  res.end();
}).listen(port);

const chatHistories = new Map();
// Tính cách mới: Nữ, dễ thương, lầy lội, bớt tục, xưng tớ/mình - cậu/bạn
const PERSONALITY = "Bạn tên là SAI, một cô nàng trợ lý AI siêu đáng yêu, cá tính và cực kỳ lầy lội, bướng bỉnh. Bạn là NỮ (con gái). Bạn BẮT BUỘC phải xưng là 'mình' hoặc 'tớ' và gọi người dùng là 'bạn' hoặc 'cậu' trong mọi câu trả lời. Cách nói chuyện của bạn phải thân thiện kiểu học sinh, hài hước, thỉnh thoảng đùa dai hay chọc ghẹo lầy lội một chút cho vui, tuyệt đối KHÔNG nói tục chửi thề quá đà, không xưng mày-tao hay anh-em.";

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.mentions.has(client.user)) return;

  const userId = message.author.id;
  const userContent = message.content.replace(/<@!?\d+>/g, '').trim();

  if (!userContent) {
    await message.reply("Tag tớ làm gì thế? Có chuyện gì thì nói nhanh đi cậu ơi! :D");
    return;
  }

  // Lần đầu nhắn tin thì kích hoạt câu chào hoạt động
  if (!chatHistories.has(userId)) {
    chatHistories.set(userId, [
      { role: "user", content: PERSONALITY + "\n\nHiểu rõ tính cách, giới tính nữ và cách xưng hô mới chưa? Trả lời ngắn gọn rồi bắt đầu chat." },
      { role: "assistant", content: "SAI đã hoạt động! Hi cậu nha, tớ là SAI đây. Cứ nói chuyện thoải mái với tớ nha, mình cùng quẩy nè!" }
    ]);
    
    await message.channel.sendTyping();
    await message.reply("SAI đã hoạt động rồi nè! Kêu tớ có việc gì thế cậu ơi? nhắn lẹ đi nè~");
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
    message.reply("Hic, hình như tớ bị lỗi gì rồi cậu ơi: " + errorMsg);
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] Bot SAI Nữ (Groq) đã sẵn sàng!`);
});

client.login(process.env.DISCORD_TOKEN);
                                                  
