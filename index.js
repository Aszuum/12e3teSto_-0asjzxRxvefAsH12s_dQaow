const {
    Client,
    GatewayIntentBits,
    PermissionsBitField,
    ActivityType,
    PresenceUpdateStatus,
    EmbedBuilder,
    SelectMenuBuilder,
    ActionRowBuilder,
} = require("discord.js");
const http = require("http");
const express = require("express");
const app = express();

app.get("/", (req, res) => {
    res.send("Бот работает!");
});

const server = http.createServer(app);
const port = 3000;
server.listen(port, () => {
    console.log(`Сервер запущен на порту ${port}`);
});

const fs = require("fs");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Добавлено для возможности чтения содержимого сообщений
    ],
});

const warningsFilePath = "warnings.txt";
let warnings = {};

// Загрузка предупреждений из файла
if (fs.existsSync(warningsFilePath)) {
    const data = fs.readFileSync(warningsFilePath, "utf8");
    if (data.trim() !== "") {
        warnings = JSON.parse(data);
    } else {
        warnings = {};
    }
}

client.once("ready", async () => {
    console.log(`Бот ${client.user.tag} подключен к Discord!`);
    await client.application.commands.set([
        {
            name: "confirm",
            description: "Подтвердить пользователя",
            options: [
                {
                    type: 6, // USER
                    name: "user",
                    description: "Пользователь для подтверждения",
                    required: true,
                },
            ],
        },
        {
            name: "unconfirm",
            description: "Отменить подтверждение пользователя",
            options: [
                {
                    type: 6, // USER
                    name: "user",
                    description: "Пользователь для отмены подтверждения",
                    required: true,
                },
            ],
        },
        {
            name: "static",
            description: "Изменить статус бота",
            options: [
                {
                    type: 3, // STRING
                    name: "activity_type",
                    description: "Тип активности",
                    required: true,
                    choices: [
                        { name: "играет", value: "PLAYING" },
                        { name: "слушает", value: "LISTENING" },
                        { name: "смотрит", value: "WATCHING" },
                        { name: "стримит", value: "STREAMING" },
                    ],
                },
                {
                    type: 3, // STRING
                    name: "status",
                    description: "Текст статуса",
                    required: true,
                },
                {
                    type: 3, // STRING
                    name: "presence_status",
                    description: "Статус присутствия",
                    required: true,
                    choices: [
                        { name: "в сети", value: "online" },
                        { name: "не активен", value: "idle" },
                        { name: "не беспокоить", value: "dnd" },
                    ],
                },
            ],
        },
        {
            name: "cl",
            description: "Удалить сообщения",
            options: [
                {
                    type: 4, // INTEGER
                    name: "count",
                    description: "Количество сообщений",
                    required: true,
                },
                {
                    type: 6, // USER
                    name: "user",
                    description: "Пользователь",
                    required: false,
                },
            ],
        },
        {
            name: "embed",
            description: "Отправить embed-сообщение",
            options: [
                {
                    type: 7, // CHANNEL
                    name: "channel",
                    description: "Канал для отправки",
                    required: true,
                },
                {
                    type: 3, // STRING
                    name: "color",
                    description: "Цвет в hex",
                    required: true,
                },
                {
                    type: 3, // STRING
                    name: "text",
                    description: "Текст сообщения",
                    required: true,
                },
                {
                    type: 11, // ATTACHMENT
                    name: "photo",
                    description: "Фото",
                    required: false,
                },
            ],
        },
        {
            name: "warn",
            description: "Выдать предупреждение пользователю",
            options: [
                {
                    type: 6, // USER
                    name: "user",
                    description: "Пользователь для выдачи предупреждения",
                    required: true,
                },
                {
                    type: 3, // STRING
                    name: "reason",
                    description: "Причина предупреждения",
                    required: true,
                },
                {
                    type: 3, // STRING
                    name: "time",
                    description:
                        "Время предупреждения (формат: hours:min:sec или all/0 для навсегда)",
                    required: true,
                },
            ],
        },
        {
            name: "unwarn",
            description: "Снять предупреждение с пользователя",
            options: [
                {
                    type: 6, // USER
                    name: "user",
                    description: "Пользователь для снятия предупреждения",
                    required: true,
                },
            ],
        },
    ]);
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === "confirm") {
        await handleConfirm(interaction);
    } else if (commandName === "unconfirm") {
        await handleUnconfirm(interaction);
    } else if (commandName === "static") {
        await handleStatic(interaction);
    } else if (commandName === "cl") {
        await handleCl(interaction);
    } else if (commandName === "embed") {
        await handleEmbed(interaction);
    } else if (commandName === "warn") {
        await handleWarn(interaction);
    } else if (commandName === "unwarn") {
        await handleUnwarn(interaction);
    }
});

async function handleConfirm(interaction) {
    const user = interaction.options.getMember("user");
    if (!user) {
        await interaction.reply({
            content: "Пользователь не найден.",
            ephemeral: true,
        });
        return;
    }
    await user.roles.remove("1270446775437623421");
    await user.roles.add("1270474331822100640");
    await interaction.reply({
        content: `Роль пользователя ${user.user.tag} обновлена.`,
        ephemeral: true,
    });
}

async function handleUnconfirm(interaction) {
    const user = interaction.options.getMember("user");
    if (!user) {
        await interaction.reply({
            content: "Пользователь не найден.",
            ephemeral: true,
        });
        return;
    }
    await user.roles.remove("1270474331822100640");
    await user.roles.add("1270446775437623421");
    await interaction.reply({
        content: `Роль пользователя ${user.user.tag} обновлена.`,
        ephemeral: true,
    });
}

async function handleStatic(interaction) {
    const activityType = interaction.options.getString("activity_type");
    const status = interaction.options.getString("status");
    const presenceStatus = interaction.options.getString("presence_status");

    const activityTypes = {
        PLAYING: ActivityType.Playing,
        LISTENING: ActivityType.Listening,
        WATCHING: ActivityType.Watching,
        STREAMING: ActivityType.Streaming,
    };

    const presenceStatuses = {
        online: PresenceUpdateStatus.Online,
        idle: PresenceUpdateStatus.Idle,
        dnd: PresenceUpdateStatus.DoNotDisturb,
    };

    client.user.setPresence({
        activities: [{ name: status, type: activityTypes[activityType] }],
        status: presenceStatuses[presenceStatus],
    });

    await interaction.reply({
        content: `Статус бота изменен на: ${activityType} ${status}, статус присутствия: ${presenceStatus}`,
        ephemeral: true,
    });
}

async function handleCl(interaction) {
    const count = interaction.options.getInteger("count");
    const user = interaction.options.getMember("user");

    await interaction.deferReply({ ephemeral: true });

    let deleted = 0;
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    for (const message of messages.values()) {
        if (deleted >= count) break;
        if (!user || message.author.id === user.id) {
            try {
                await message.delete();
                deleted += 1;
            } catch (error) {
                await interaction.followUp({
                    content: `Произошла ошибка при удалении сообщения: ${error}`,
                    ephemeral: true,
                });
                return;
            }
        }
    }

    await interaction.followUp({
        content: `Удалено ${deleted} сообщений.`,
        ephemeral: true,
    });
}

async function handleEmbed(interaction) {
    const channel = interaction.options.getChannel("channel");
    const color = interaction.options.getString("color");
    const text = interaction.options.getString("text");
    const photo = interaction.options.getAttachment("photo");

    if (!channel || !color || !text) {
        await interaction.reply({
            content: "Не все обязательные параметры указаны.",
            ephemeral: true,
        });
        return;
    }

    const embed = new EmbedBuilder().setColor(color);

    if (text.startsWith("#") && text.endsWith("#")) {
        embed.setTitle(text.slice(1, -1));
    } else {
        embed.setDescription(text);
    }

    if (photo) {
        embed.setImage(photo.url);
    }

    await channel.send({ embeds: [embed] });
    await interaction.reply({
        content: "Embed-сообщение отправлено.",
        ephemeral: true,
    });
}

async function handleWarn(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const time = interaction.options.getString("time");

    if (!warnings[user.id]) {
        warnings[user.id] = { count: 0, reasons: [], timers: [] };
    } else if (!warnings[user.id].timers) {
        warnings[user.id].timers = [];
    }

    if (warnings[user.id].count >= 3) {
        await interaction.reply({
            content: `Пользователь ${user.tag} уже имеет максимальное количество предупреждений \n (3/3).`,
            ephemeral: true,
        });
        return;
    }

    warnings[user.id].count += 1;
    warnings[user.id].reasons.push(reason);

    const timeDisplay =
        time === "0" || time.toLowerCase() === "all" ? "Навсегда" : time;

    const embed = new EmbedBuilder()
        .setColor("#FF0000") // Красный цвет для блокировки
        .setTitle("Вы получили наказание!")
        .addFields(
            {
                name: "Сервер",
                value: "[Aszuum](https://discord.gg/n7vCejGgKk)",
                inline: true,
            },
            {
                name: "Тип наказания",
                value: `Warn (${warnings[user.id].count}/3)`,
                inline: true,
            },
            {
                name: "Администратор",
                value: interaction.user.tag,
                inline: true,
            },
            { name: "Причина", value: reason, inline: true },
            { name: "Дата", value: new Date().toLocaleString(), inline: true },
            { name: "Время наказания", value: timeDisplay, inline: true },
        );

    await user.send({ embeds: [embed] }).catch(console.error);

    if (warnings[user.id].count === 3) {
        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("Предельное количество наказаний")
            .setDescription(
                `У пользователя ${user.tag} придельное кол-во наказаний 3.\nПричины: ${warnings[user.id].reasons.join(", ")}`,
            );
        await interaction.channel.send({ embeds: [embed] });
    }

    if (time !== "0" && time.toLowerCase() !== "all") {
        const [hours, minutes, seconds] = time.split(":").map(Number);
        const ms = (hours * 3600 + minutes * 60 + seconds) * 1000;
        const timer = setTimeout(async () => {
            await handleUnwarn({
                options: {
                    getUser: () => user,
                    getString: () => "Истекло время наказания",
                },
                user: interaction.user,
                reply: interaction.reply, // Передаем метод reply
            });
        }, ms);
        warnings[user.id].timers.push(timer);
    }

    saveWarnings();

    await interaction.reply({
        content: `Пользователь ${user.tag} получил предупреждение.`,
        ephemeral: true,
    });
}

async function handleUnwarn(interaction) {
    const user = interaction.options.getUser("user");

    if (!warnings[user.id] || warnings[user.id].count === 0) {
        await interaction.reply({
            content: `Пользователь ${user.tag} не имеет предупреждений.`,
            ephemeral: true,
        });
        return;
    }

    const reasons = warnings[user.id].reasons;
    if (reasons.length === 0) {
        await interaction.reply({
            content: `Пользователь ${user.tag} не имеет предупреждений.`,
            ephemeral: true,
        });
        return;
    }

    const selectMenu = new SelectMenuBuilder()
        .setCustomId("unwarn_select")
        .setPlaceholder("Выберите причину для снятия предупреждения")
        .addOptions(
            reasons.map((reason, index) => {
                const roiText = `(${index + 1}/3)`;
                return {
                    label: roiText,
                    value: reason,
                    description: `Причина: ${reason}`,
                };
            }),
        );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
        content: "Какое предупреждение снять с пользователя?",
        components: [row],
        ephemeral: true,
    });
}

client.on("interactionCreate", async (interaction) => {
    if (interaction.customId === "unwarn_select") {
        const user = interaction.message.interaction.user;
        const reason = interaction.values[0];

        if (!warnings[user.id] || warnings[user.id].count === 0) {
            await interaction.update({
                content: `Пользователь ${user.tag} не имеет предупреждений.`,
                components: [],
                ephemeral: true,
            });
            return;
        }

        warnings[user.id].count -= 1;
        warnings[user.id].reasons = warnings[user.id].reasons.filter(
            (r) => r !== reason,
        );

        const embed = new EmbedBuilder()
            .setColor("#008000") // Темно-зеленый цвет для снятия блокировки
            .setTitle("С вас сняли наказание!")
            .addFields(
                {
                    name: "Сервер",
                    value: "[Aszuum](https://discord.gg/n7vCejGgKk)",
                    inline: true,
                },
                {
                    name: "Тип наказания",
                    value: `Warn (${warnings[user.id].count}/3)`,
                    inline: true,
                },
                {
                    name: "Администратор",
                    value: interaction.user.tag,
                    inline: true,
                },
                { name: "Причина", value: reason, inline: true },
                {
                    name: "Дата",
                    value: new Date().toLocaleString(),
                    inline: true,
                },
            );

        await user.send({ embeds: [embed] }).catch(console.error);

        saveWarnings();

        await interaction.update({
            content: `Предупреждение с пользователя ${user.tag} снято.`,
            components: [],
            ephemeral: true,
        });
    }
});

function cloneWarningsWithoutTimers(warnings) {
    const clonedWarnings = {};
    for (const userId in warnings) {
        const userWarnings = warnings[userId];
        clonedWarnings[userId] = {
            count: userWarnings.count,
            reasons: userWarnings.reasons,
            // Исключаем поле timers
        };
    }
    return clonedWarnings;
}

function saveWarnings() {
    const warningsToSave = cloneWarningsWithoutTimers(warnings);
    fs.writeFileSync(warningsFilePath, JSON.stringify(warningsToSave, null, 2));
}

client.login(process.env.DISCORD_TOKEN);
