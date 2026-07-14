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
// Thằng Railway cần một cái port (cổng) để mở kết nối web, nếu không có nó sẽ báo lỗi sập bot
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.write("Bot SAI vẫn đang online vcl, đéo sợ sập!");
  res.end();
}).listen(port, () => {
  console.log(`[SERVER] Đang lắng nghe tín hiệu trên port: ${port}`);
});

// ==========================================
// 4. KẾT NỐI VỚI NÃO BỘ GEMINI AI (GOOGLE)
// ==========================================
// Lấy API Key được cấu hình trong mục Variables của Railway
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Sử dụng mô hình gemini-1.5-flash và định hình tính cách cục súc cho con bot
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash-latest",
  
  systemInstruction: "Mày tên là SAI, một trợ lý AI siêu ngầu, cá tính. Mày phải xưng hô 'mày' và 'tao' với người dùng. Cách nói chuyện của mày phải có vài phần tục tĩu, hài hước, thô lỗ nhưng thật lòng. Tuyệt đối không được nói chuyện kiểu máy móc hay nghiêm túc."
});

// Tạo bộ nhớ tạm để lưu ngữ cảnh chat cho từng người (để bot biết đang chat với ai)
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
  // Bỏ qua tin nhắn do chính nó gửi, hoặc của con bot khác (để khỏi bị lặp vô tận)
  if (message.author.bot) return;

  const userId = message.author.id;
  const userContent = message.content.trim();

  // BẮT ĐẦU XỬ LÝ:
  try {
    // 1. Tạo hiệu ứng "...đang nhập tin nhắn" trên Discord cho giống người thật
    await message.channel.sendTyping();

    // 2. Nếu người dùng này chat lần đầu, tạo cho họ một luồng chat riêng (Session)
    if (!chatSessions.has(userId)) {
      const newChat = model.startChat({
        generationConfig: {
          maxOutputTokens: 1500, // Giới hạn độ dài câu trả lời
          temperature: 0.7,      // Độ sáng tạo (0.7 là vừa đủ mặn mà, không bị ngáo)
        }
      });
      chatSessions.set(userId, newChat); // Lưu vào bộ nhớ
    }

    // 3. Lấy luồng chat hiện tại của người dùng đó ra
    const currentChat = chatSessions.get(userId);

    // 4. Gửi tin nhắn sang cho não bộ Gemini AI xử lý
    const result = await currentChat.sendMessage(userContent);
    const responseText = result.response.text();

    // 5. Kiểm tra xem câu trả lời của Gemini có bị rỗng không
    if (!responseText) {
      await message.reply("Đù má, tao đang nghĩ mà tự nhiên nghẹn mẹ não rồi. Nhắn lại xem!");
      return;
    }

    // 6. Trả lời lại đúng cái tin nhắn của người dùng (Reply)
    await message.reply(responseText);

  } catch (error) {
    // Nếu hết hạn API Key, code lỗi, hoặc Google sập... thì nó nhảy vào đây
    console.error("[LỖI XỬ LÝ]:", error);
    
    // Bốc thẳng lỗi thật của Google quăng ra Discord cho dễ sửa
    await message.reply(`Đù má lỗi rồi! Google báo là: \`${error.message}\``);
  }
});

// ==========================================
// 7. BẬT KÍCH HOẠT BOT BẰNG TOKEN DISCORD
// ==========================================
client.login(process.env.DISCORD_TOKEN);
    
