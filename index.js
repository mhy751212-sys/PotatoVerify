const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const { Rcon } = require('rcon-client');

const TOKEN = '';
const CLIENT_ID = '';
const RCON_CONFIG = {
    host: '',
    port: 25565,
    password: ''
};

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const commands = [
    new SlashCommandBuilder().setName('ban').setDescription('유저 밴')
        .addStringOption(o => o.setName('닉네임').setRequired(true))
        .addStringOption(o => o.setName('사유').setRequired(true)),
    new SlashCommandBuilder().setName('후원').setDescription('후원 처리')
        .addUserOption(o => o.setName('유저').setRequired(true))
        .addIntegerOption(o => o.setName('금액').setRequired(true))
        .addStringOption(o => o.setName('마크닉네임').setRequired(true))
].map(c => c.toJSON());

client.once('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('봇 연결됨');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    try {
        const rcon = await Rcon.connect(RCON_CONFIG);

        if (interaction.commandName === 'ban') {
            const nick = interaction.options.getString('닉네임');
            const reason = interaction.options.getString('사유');
            const logChannelId = '로그_채널_ID_입력';
            
            await rcon.send('ban ' + nick);
            await interaction.reply(nick + '님을 밴했습니다');

            const channel = await client.channels.fetch(logChannelId);
            if (channel) {
                const logMessage = 
                    '형량: 영구 밴\n' +
                    '처벌내용: 서버 접속 차단\n' +
                    '처분관리자: ' + interaction.user.tag + '\n' +
                    '사유: ' + reason;
                await channel.send(logMessage);
            }
        }

        else if (interaction.commandName === '후원') {
            const amount = interaction.options.getInteger('금액');
            const mcNick = interaction.options.getString('마크닉네임');
            let group = '';

            if (amount >= 7000) group = '02후원a';
            else if (amount >= 5000) group = '01후원a';
            else {
                await interaction.reply('실패');
                return;
            }

            await rcon.send('lp user ' + mcNick + ' parent add ' + group);
            await interaction.reply(mcNick + '님에게 ' + group + ' 지급했습니다');
        }

        await rcon.end();
    } catch (err) {
        console.error(err);
        await interaction.reply('오류 발생');
    }
});

client.login(TOKEN);