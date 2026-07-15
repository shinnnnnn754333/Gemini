// ==========================================
// 1. KHAI BÁO THƯ VIỆN
// ==========================================
const { Client, GatewayIntentBits } = require('discord.js');
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
  res.write("Bot SAI - Đã gỡ lời nguyền API v1beta và 404!");
  res.end();
}).listen(port, () => {
  console.log(`[SERVER] Port đang chạy: ${port}`);
});

// ==========================================
// 4. BỘ NHỚ VÀ TÍNH CÁCH
// ==========================================
const chatHistories = new Map();
const SYSTEM_INSTRUCTION = "Mày tên là SAI, một trợ lý AI siêu ngầu, cá tính. Mày phải xưng hô 'mày' và 'tao' với người dùng. Cách nói chuyện của mày phải có vài phần tục tĩu, hài hước, thô lỗ nhưng thật lòng. Tuyệt đối không được nói chuyện kiểu máy móc hay nghiêm túc.";

client.once('ready', () => {
  console.log(`[ONLINE] Bot SAI bộc phá đã sẵn sàng!`);
});

// ==========================================
// 5. XỬ LÝ TIN NHẮN (API TAY)
// ==========================================
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Bắt buộc tag @SAI mới trả lời
  if (!message.mentions.has(client.user)) return;

  const userId = message.author.id;
  
  // Dọn dẹp cái tag ra khỏi tin nhắn
  const userContent = message.content.replace(`<@!${client.user.id}>`, '').replace(`<@${client.user.id}>`, '').trim();

  if (!userContent) {
    await message.reply("Tag tao làm đéo gì? Nói chuyện coi!");
    return;
  }

  try {
    await message.channel.sendTyping();

    // Tạo lịch sử chat nếu chưa có
    if (!chatHistories.has(userId)) {
      chatHistories.set(userId, []);
    }
    const history = chatHistories.get(userId);
    
    // Nạp câu hỏi của user vào mảng lịch sử
    history.push({ role: "user", parts: [{ text: userContent }] });
    if (history.length > 20) history.shift();

    // ----------------------------------------------------
    // CÚ CHỐT: XÀI V1BETA NHƯNG ĐỔI TÊN MODEL THÀNH LATEST
    // ----------------------------------------------------
    const API_KEY = process.env.GEMINI_API_KEY;
    
    // ĐỔI LINK Ở ĐÂY: Dùng v1beta và model gemini-1.5-flash-latest
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: history,
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        generationConfig: {
          maxOutputTokens: 1500,
          temperature: 0.7,
        }
      })
    });

    const data = await response.json();

    // Check xem Google có quăng lỗi gì không
    if (data.error) {
      throw new Error(data.error.message);
    }

    // Lấy câu trả lời ra
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error("Dữ liệu từ Google trả về bị rỗng mẹ rồi!");
    }

    const responseText = data.candidates[0].content.parts[0].text;

    // Lưu câu trả lời vào lịch sử
    history.push({ role: "model", parts: [{ text: responseText }] });
    await message.reply(responseText);

  } catch (error) {
    console.error("[LỖI CHÍ MẠNG]:", error);
    await message.reply(`Đù má lỗi rồi! Google báo là: \`${error.message}\``);
  }
});

client.on('error', console.error);

client.login(process.env.DISCORD_TOKEN);
    
