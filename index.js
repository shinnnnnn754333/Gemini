// ==========================================
// 1. KHAI BÁO CÁC THƯ VIỆN CẦN THIẾT
// ==========================================
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');

// ==========================================
// 2. CẤU HÌNH QUYỀN TRUY CẬP CHO BOT (INTENTS)
// ==========================================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ==========================================
// 3. TẠO SERVER WEB ẢO ĐỂ GIỮ BOT SỐNG TRÊN RAILWAY
// ==========================================
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.write("Bot SAI vẫn đang online vcl, đéo sợ sập!");
  res.end();
}).listen(port, () => {
  console.log(`[SERVER] Đang lắng nghe tín hiệu trên port: ${port}`);
});

// ==========================================
// 4. KẾT NỐI VỚI NÃO BỘ GEMINI AI (GOOGLE V1)
// ==========================================
// Thêm cấu hình apiVersion 'v1' ở đây để lách qua cái bộ lọc lỗi vùng của thằng Pháp
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, { apiVersion: 'v1' });

// Sử dụng mô hình ổn định nhất
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: "Mày tên là SAI, một trợ lý AI siêu ngầu, cá tính. Mày phải xưng hô 'mày' và 'tao' với người dùng. Cách nói chuyện của mày phải có vài phần tục tĩu, hài hước, thô lỗ nhưng thật lòng. Tuyệt đối không được nói chuyện kiểu máy móc hay nghiêm túc."
});

const chatSessions = new Map();

// ==========================================
// 5. SỰ KIỆN KHI BOT ĐĂNG NHẬP THÀNH CÔNG
// ==========================================
client.once('ready', () => {
  console.log(`[THÀNH CÔNG RỰC RỠ] Bot đã online! Tên tag trên Discord: ${client.user.tag}`);
});

// ==========================================
// 6. XỬ LÝ KHI CÓ NGƯỜI NHẮN TIN TRONG SERVER
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const userId = message.author.id;
  const userContent = message.content.trim();

  try {
    await message.channel.sendTyping();

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
      await message.reply("Đù má, tao đang nghĩ mà tự nhiên nghẹn mẹ não rồi. Nhắn lại xem!");
      return;
    }

    await message.reply(responseText);

  } catch (error) {
    console.error("[LỖI XỬ LÝ]:", error);
    await message.reply(`Đù má lỗi rồi! Google báo là: \`${error.message}\``);
  }
});

// ==========================================
// 7. BẬT KÍCH HOẠT BOT BẰNG TOKEN DISCORD
// ==========================================
client.login(process.env.DISCORD_TOKEN);
      
