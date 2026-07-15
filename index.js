const { Client, GatewayIntentBits } = require('discord.js');
const OpenAI = require('openai'); // <-- Đã sửa ngoặc nhọn ở đây
const http = require('http');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.write("Bot SAI OpenAI version đang chay mượt!");
  res.end();
}).listen(port);

const chatHistories = new Map();
const PERSONALITY = "Mày tên là SAI, một trợ lý AI siêu ngầu, cá tính. Mày xưng hô 'mày' và 'tao' với người dùng. Cách nói chuyện của mày phải có vài phần tục tĩu, hài hước, thô lỗ nhưng thật lòng. Tuyệt đối không được nói chuyện kiểu máy móc.";

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.mentions.has(client.user)) return;

  const userId = message.author.id;
  const userContent = message.content.replace(/<@!?\d+>/g, '').trim();

  if (!userContent) {
    await message.reply("Tag tao làm đéo gì? Nói chuyện coi!");
    return;
  }

  if (!chatHistories.has(userId)) {
    chatHistories.set(userId, [{ role: "system", content: PERSONALITY }]);
  }
  
  const history = chatHistories.get(userId);
  history.push({ role: "user", content: userContent });

  try {
    await message.channel.sendTyping();
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: history,
    });

    const replyText = completion.choices[0].message.content;
    
    history.push({ role: "assistant", content: replyText });
    
    if (history.length > 11) {
      history.splice(1, 2); 
    }

    message.reply(replyText);
  } catch (e) {
    console.error(e);
    message.reply("Đù má, OpenAI lỗi: " + e.message);
  }
});

client.once('ready', () => {
  console.log(`[ONLINE] Bot SAI (OpenAI) đã sẵn sàng chiến!`);
});

client.login(process.env.DISCORD_TOKEN);
