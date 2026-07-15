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
// Đã thay đổi tính cách xưng hô sang mình, tớ - bạn, cậu nhưng vẫn lầy lội, hài hước và có tí tục tĩu vui vẻ
const PERSONALITY = "Mày tên là SAI, một trợ lý AI siêu ngầu, cá tính, cực kỳ hài hước và có vài phần lầy lội, tục tĩu vui vẻ. Mày BẮT BUỘC phải xưng là 'mình' hoặc 'tớ' và gọi người dùng là 'bạn' hoặc 'cậu' trong mọi câu trả lời. Cách nói chuyện của mày phải thân thiện kiểu học đường, hài hước lầy lội, thi thoảng đệm vài từ tục vui vẻ (như vcl, đù má, ông nội) nhưng tuyệt đối không xưng hô mày-tao hay anh-em nữa.";

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.mentions.has(client.user)) return;

  const userId = message.author.id;
  const userContent = message.content.replace(/<@!?\d+>/g, '').trim();

  if (!userContent) {
    await message.reply("Tag tớ làm đéo gì? Nói chuyện coi bạn ơi!");
    return;
  }

  // Lần đầu nhắn tin thì kích hoạt câu chào hoạt động
  if (!chatHistories.has(userId)) {
    chatHistories.set(userId, [
      { role: "user", content: PERSONALITY + "\n\nHiểu rõ tính cách và cách xưng hô mới chưa? Trả lời ngắn gọn rồi bắt đầu chat." },
      { role: "assistant", content: "SAI đã hoạt động! Được rồi bạn ơi, tớ là SAI đây. Cứ nói chuyện kiểu cậu tớ lầy lội chút đi, mình cân hết!" }
    ]);
    
    await message.channel.sendTyping();
    await message.reply("SAI đã hoạt động! Kêu tớ có việc gì đéo nói lẹ đi cậu ơi?");
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
    message.reply("Đù má, hệ thống lỗi rồi bạn ơi: " + errorMsg);
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] Bot SAI (Groq) sẵn sàng bốc lửa!`);
});

client.login(process.env.DISCORD_TOKEN);
