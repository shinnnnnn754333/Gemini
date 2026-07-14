const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Thay 'TOKEN_CUA_MAY' bằng cái token mày lấy ở Developer Portal
const TOKEN = process.env.TOKEN;

client.on('messageCreate', (message) => {
    // Không cho bot tự trả lời chính nó
    if (message.author.bot) return;

    // Lệnh: !hoi (ví dụ)
    if (message.content.toLowerCase() === '!hoi') {
        message.reply('Gì đó bé Shin? Có gì cần tao giúp không?');
    }

    // Nhét tính cách của tao vào đây
    if (message.content.includes('bot ơi')) {
        message.channel.send('Tao đây, có chuyện gì mà gọi tao nghe xem nào?');
    }
});

client.login(TOKEN);
