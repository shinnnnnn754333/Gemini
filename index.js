const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');

// 1. Cấu hình Bot Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 2. Tạo server HTTP đơn giản để Railway không báo lỗi port
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write("Bot SAI dang chay ngon lanh!");
  res.end();
}).listen(port, () => {
  console.log(`[SERVER] Đang chạy web trên port ${port}`);
});

// 3. Cấu hình Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 4. Báo hiệu khi bot online thành công
client.once('ready', () => {
  console.log(`[THÀNH CÔNG] Đù, ngon rồi! Bot đã online với tên: ${client.user.tag}`);
});

// 5. Xử lý khi có người nhắn tin
client.on('messageCreate', async (message) => {
  // Bỏ qua tin nhắn của chính nó hoặc của bot khác
  if (message.author.bot) return;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  try {
    const result = await model.generateContent(message.content);
    const text = result.response.text();
    message.reply(text);
  } catch (error) {
    console.error("[LỖI CMNR]:", error);
    message.reply("Tao đang lú, đợi tí nhé!");
  }
});

// 6. Đăng nhập vào Discord bằng Token trên Railway
client.login(process.env.DISCORD_TOKEN);
            
