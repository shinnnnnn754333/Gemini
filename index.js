// ==========================================
// 1. KHAI BÁO CÁC THƯ VIỆN CẦN THIẾT
// ==========================================
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');

// ==========================================
// 2. KHỞI TẠO BOT DISCORD & CẤP QUYỀN (INTENTS)
// ==========================================
// Nhớ check kỹ trong Discord Developer Portal > Bot > Privileged Gateway Intents
// Phải bật XANH 3 cái: Message Content Intent, Server Members Intent, Presence Intent nhé!
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // Quyền quản lý server cơ bản
    GatewayIntentBits.GuildMessages,    // Quyền đọc/ghi tin nhắn trong server
    GatewayIntentBits.MessageContent    // Quyền lấy nội dung tin nhắn chat (Quan trọng nhất!)
  ]
});

// ==========================================
// 3. TẠO SERVER WEB ĐỂ QUA MẮT HEALTH CHECK CỦA RAILWAY
// ==========================================
// Railway yêu cầu mọi ứng dụng phải mở một cổng Port để nó kiểm tra xem ứng dụng còn sống không.
// Nếu không mở port này, sau 5-10 phút Railway sẽ tự động chặt đầu (SIGTERM) con bot của mày.
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.write("Bot SAI vẫn đang online vcl, đéo sợ sập!");
  res.end();
}).listen(port, () => {
  console.log(`[SERVER] Đang lắng nghe tín hiệu ở cổng: ${port}`);
});

// ==========================================
// 4. KẾT NỐI VỚI NÃO BỘ GEMINI AI (GOOGLE)
// ==========================================
// Lấy API Key được cấu hình trong mục Variables của Railway
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Sử dụng mô hình gemini-1.5-flash vừa nhanh, vừa tiết kiệm, vừa thông minh
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  // Định hình tính cách cho con bot nằm ở đây nè mày!
  systemInstruction: "Mày tên là SAI, một trợ lý AI siêu ngầu, cá tính. Mày phải xưng hô 'mày' và 'tao' với người dùng. Cách nói chuyện của mày phải có vài phần tục tĩu, hài hước, thô lỗ nhưng thật lòng, giống như một thằng bạn thân lâu năm. Tuyệt đối không được nói chuyện kiểu máy móc, lễ phép hay nghiêm túc quá mức."
});

// Tạo một bộ nhớ tạm (Map) để lưu trữ các cuộc trò chuyện riêng biệt của từng người dùng.
// Nhờ cái này mà bot sẽ không bị mất trí nhớ, mày nói câu trước nó sẽ nhớ để trả lời câu sau.
const chatSessions = new Map();

// ==========================================
// 5. SỰ KIỆN KHI BOT ĐĂNG NHẬP THÀNH CÔNG VÀO DISCORD
// ==========================================
client.once('ready', () => {
  console.log(`[THÀNH CÔNG RỰC RỠ] Bot đã online! Tên tag trên Discord: ${client.user.tag}`);
});

// ==========================================
// 6. XỬ LÝ KHI CÓ NGƯỜI NHẮN TIN TRONG SERVER
// ==========================================
client.on('messageCreate', async (message) => {
  // Nếu là tin nhắn do chính con bot này gửi, hoặc của con bot khác thì bỏ qua (Đỡ bị lặp vô tận)
  if (message.author.bot) return;

  // Lấy ID của người nhắn để phân biệt bộ nhớ chat của từng người
  const userId = message.author.id;
  const userContent = message.content.trim();

  // BẮT ĐẦU XỬ LÝ:
  try {
    // 1. Tạo hiệu ứng "...đang nhập tin nhắn" trên Discord cho giống người thật đang gõ
    await message.channel.sendTyping();

    // 2. Nếu người dùng này lần đầu tiên chat với bot, hãy tạo cho họ một luồng chat mới (Chat Session)
    if (!chatSessions.has(userId)) {
      const newChat = model.startChat({
        generationConfig: {
          maxOutputTokens: 1500, // Giới hạn độ dài câu trả lời tối đa
          temperature: 0.7,      // Độ sáng tạo (0.7 là vừa đủ hài hước, không bị ngáo)
        }
      });
      // Lưu cái luồng chat này vào bộ nhớ map
      chatSessions.set(userId, newChat);
    }

    // 3. Lấy luồng chat hiện tại của người dùng đó ra
    const currentChat = chatSessions.get(userId);

    // 4. Gửi tin nhắn của người dùng sang cho hệ thống Gemini AI xử lý
    const result = await currentChat.sendMessage(userContent);
    const responseText = result.response.text();

    // 5. Kiểm tra xem câu trả lời của Gemini có bị trống không
    if (!responseText) {
      await message.reply("Đù má, tao đang nghĩ mà tự nhiên nghẽn mẹ não rồi. Nhắn lại xem!");
      return;
    }

    // 6. Trả lời lại đúng cái tin nhắn của người dùng đó bằng hình thức Reply (Trích dẫn)
    await message.reply(responseText);

  } catch (error) {
    // Nếu có bất kỳ lỗi gì xảy ra (Hết hạn API Key, code lỗi, lỗi Discord...) thì nó nhảy vào đây
    console.error("[LỖI XỬ LÝ]:", error);
    
    // Thông báo lỗi ra Discord cho mày biết đường mà sửa
    await message.reply("Đù má, có lỗi gì rồi bé Shin ơi! Check lại log trên Railway hoặc xem lại cái GEMINI_API_KEY giùm tao cái!");
  }
});

// ==========================================
// 7. BẮT ĐẦU KÍCH HOẠT BOT BẰNG TOKEN
// ==========================================
// Token này được lấy từ Variables trên Railway
client.login(process.env.DISCORD_TOKEN);


