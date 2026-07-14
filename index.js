// ==========================================
// 1. KHAI BÁO CÁC THƯ VIỆN CẦN THIẾT
// ==========================================
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');

// ==========================================
// 2. CẤU HÌNH QUYỀN TRUY CẬP CHO BOT
// ==========================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ==========================================
// 3. TẠO SERVER WEB ẢO GIỮ BOT SỐNG
// ==========================================
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.write("Bot SAI thân thiện ai tag cũng rep đang online!");
  res.end();
}).listen(port, () => {
  console.log(`[SERVER] Port: ${port}`);
});

// ==========================================
// 4. KẾT NỐI VỚI GEMINI AI (CỔNG V1 CHÍNH THỨC)
// ==========================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, { apiVersion: 'v1' });

const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: "Mày tên là SAI, một trợ lý AI siêu ngầu, cá tính. Mày phải xưng hô 'mày' và 'tao' với người dùng. Cách nói chuyện của mày phải có vài phần tục tĩu, hài hước, thô lỗ nhưng thật lòng. Tuyệt đối không được nói chuyện kiểu máy móc hay nghiêm túc."
});

const chatSessions = new Map();

// ==========================================
// 5. SỰ KIỆN KHI BOT ONLINE
// ==========================================
client.once('ready', () => {
  console.log(`[ONLINE] Bot SAI thân thiện đã sẵn sàng! Ai tag cũng rep!`);
});

// ==========================================
// 6. XỬ LÝ TIN NHẮN TRONG SERVER
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // ĐIỀU KIỆN: Phải tag con bot (@SAI) thì nó mới chạy tiếp, không tag nó im lặng bơ luôn
  if (!message.mentions.has(client.user)) return;

  const userId = message.author.id;
  
  // Xóa cái đoạn tag @bot trong câu tin nhắn đi để tránh làm nhiễu Gemini
  const userContent = message.content.replace(`<@!${client.user.id}>`, '').replace(`<@${client.user.id}>`, '').trim();

  // Nếu trống trơn không nói gì mà chỉ tag không thì nhắc nhở nhẹ
  if (!userContent) {
    await message.reply("Tag tao làm đéo gì? Nói chuyện coi!");
    return;
  }

  // ĐÃ MỞ KHÓA: Đéo kiểm tra MASTER_ID nữa, ai tag cũng được tiếp đãi như nhau!
  try {
    await message.channel.sendTyping();

    // Mỗi đứa tag sẽ có một lịch sử chat riêng biệt không ai đụng ai
    if (!chatSessions.has(userId)) {
      const newChat = model.startChat({
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.7,
        }
      });
      chatSessions.set(userId, newChat);
    }

    const currentChat = chatSessions.get(userId);
    const result = await currentChat.sendMessage(userContent);
    const responseText = result.response.text();

    if (!responseText) {
      await message.reply("Đù má nghẹn não rồi, nhắn lại cái xem!");
      return;
    }

    await message.reply(responseText);

  } catch (error) {
    console.error("[LỖI]:", error);
    await message.reply(`Đù má lỗi rồi! Google báo là: \`${error.message}\``);
  }
});

client.login(process.env.DISCORD_TOKEN);

