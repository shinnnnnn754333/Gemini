const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent 
    ] 
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // Mày thêm biến GEMINI_API_KEY ở Railway nhé

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    // Bot chỉ trả lời khi được tag hoặc trong kênh cụ thể nếu mày muốn
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
