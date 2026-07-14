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
  res.write("Bot SAI phế vật đã được thông não thành công!");
  res.end();
}).listen(port, () => {
  console.log(`[SERVER] Port đang chạy: ${port}`);
});

// ==========================================
// 4. KẾT NỐI VỚI GEMINI AI (ÉP BUỘC CHẠY V1)
// ==========================================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY, { apiVersion: 'v1' });

// Dùng mô hình chuẩn đời mới
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash"
});

// Bộ nhớ lưu lịch sử chat cho từng người
const chatHistories = new Map();

// Định hình tính cách cho con bot
const SYSTEM_INSTRUCTION = "Mày tên là SAI, một trợ lý AI siêu ngầu, cá tính. Mày phải xưng hô 'mày' và 'tao' với người dùng. Cách nói chuyện của mày phải có vài phần tục tĩu, hài hước, thô lỗ nhưng thật lòng. Tuyệt đối không được nói chuyện kiểu máy móc hay nghiêm túc.";

// ==========================================
// 5. SỰ KIỆN KHI BOT ONLINE
// ==========================================
client.once('ready', () => {
  console.log(`[ONLINE] Bot SAI quốc dân đã sẵn sàng!`);
});

// ==========================================
// 6. XỬ LÝ TIN NHẮN TRONG SERVER
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // ĐIỀU KIỆN: Phải tag con bot (@SAI) thì nó mới trả lời
  if (!message.mentions.has(client.user)) return;

  const userId = message.author.id;
  
  // Xóa đoạn tag @bot trong câu tin nhắn
  const userContent = message.content.replace(`<@!${client.user.id}>`, '').replace(`<@${client.user.id}>`, '').trim();

  if (!userContent) {
    await message.reply("Tag tao làm đéo gì? Nói chuyện coi!");
    return;
  }

  try {
    await message.channel.sendTyping();

    // Nếu người dùng chat lần đầu, tạo mảng lịch sử mới
    if (!chatHistories.has(userId)) {
      chatHistories.set(userId, []);
    }

    const history = chatHistories.get(userId);
    
    // Thêm câu hỏi mới của user vào lịch sử
    history.push({ role: "user", parts: [{ text: userContent }] });

    // Giới hạn lịch sử lưu tối đa 20 câu gần nhất để tránh tràn bộ nhớ
    if (history.length > 20) history.shift();

    // Gọi trực tiếp generateContent (Bỏ qua startChat lỗi của Google)
    const result = await model.generateContent({
      contents: history,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        maxOutputTokens: 1500,
        temperature: 0.7,
      }
    });

    const responseText = result.response.text();

    if (!responseText) {
      await message.reply("Đù má nghẹn não rồi, nhắn lại cái xem!");
      return;
    }

    // Thêm câu trả lời của bot vào lịch sử để nhớ ngữ cảnh
    history.push({ role: "model", parts: [{ text: responseText }] });

    await message.reply(responseText);

  } catch (error) {
    console.error("[LỖI CHÍ MẠNG]:", error);
    await message.reply(`Đù má lỗi rồi! Google báo là: \`${error.message}\``);
  }
});

client.login(process.env.DISCORD_TOKEN);
  
