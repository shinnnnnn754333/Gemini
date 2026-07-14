const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http'); // Đưa nó lên đầu file nhé

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Thêm cái server giả lập ở đây để Vercel không tắt bot
http.createServer((req, res) => {
    res.write("Bot Shin dang on!");
    res.end();
}).listen(3000);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        const result = await model.generateContent(message.content);
        const response = await result.response;
        message.reply(response.text());
    } catch (error) {
        console.error(error);
        message.reply("Tao đang lú, đợi tí nhé!");
    }
});

client.login(process.env.TOKEN);
