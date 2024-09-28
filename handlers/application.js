require("dotenv").config();
const { Client, GatewayIntentBits, ActivityType } = require("discord.js");
const config = require("./configuration.js");
const getStats = require("./getStats.js");
const cliColor = require("cli-color");

module.exports = function Application() {
    console.log(cliColor.cyanBright("[PSS] ") + cliColor.green("Starting app..."));

    const client = new Client({
        intents: [GatewayIntentBits.Guilds]
    });

    client.once("ready", async () => {
        console.log(cliColor.cyanBright("[PSS] ") + cliColor.green(`${cliColor.blueBright(client.user.tag)} is online!`));

        if (config.presence.enable) {
            if (config.presence.text && config.presence.type) {
                switch (config.presence.type.toLowerCase()) {
                    case "playing":
                        config.presence.type = ActivityType.Playing;
                        break;
                    case "listening":
                        config.presence.type = ActivityType.Listening;
                        break;
                    case "competing":
                        config.presence.type = ActivityType.Competing;
                        break;
                    default:
                        config.presence.type = ActivityType.Watching;
                }

                client.user.setActivity(config.presence.text, {
                    type: config.presence.type,
                });
            }

            if (config.presence.status) {
                if (!["idle", "online", "dnd", "invisible"].includes(
                    config.presence.status.toLowerCase()
                ))
                    config.presence.status = "online";

                client.user.setStatus(config.presence.status);
            }
        }

        await getStats(client)
        setInterval(() => getStats(client), config.refresh * 1000);
    });

    try {
        client.login(process.env?.DiscordBotToken);
    } catch {
        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("Discord Error | Invalid Discord Bot Token! Make sure you have the correct token in the config!"));
        process.exit();
    }
}

function handleDiscordError(error) {
    try {
        if (error.rawError?.code === 429) {
            console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("Error 429 | Your IP has been rate limited by either Discord or your website. If it's a rate limit with Discord, you must wait. If it's a issue with your website, consider whitelisting your server IP."));
        } else if (error.rawError?.code === 403) {
            console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("FORBIDDEN | The channel ID you provided is incorrect. Please double check you have the right ID. If you're not sure, read our documentation: \n>>https://github.com/HirziDevs/PSS#getting-channel-id<<"));
        } else if (error.code === "ENOTFOUND") {
            console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("ENOTFOUND | DNS Error. Ensure your network connection and DNS server are functioning correctly."));
        } else if (error.rawError?.code === 50001) {
            console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("Discord Error | Your discord bot doesn't have access to see/send message/edit message in the channel!"));
        } else if (error.rawError?.errors && Object?.values(error.rawError.errors)[0]?._errors[0]?.code === "MAX_EMBED_SIZE_EXCEEDED") {
            console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("Discord Error | Embed message limit exceeded! Please limit or decrease the nodes that need to be shown in the config!"));
        } else if (error.rawError?.errors && Object?.values(error.rawError.errors)[0]?._errors[0]?.code) {
            console.log(Object.values(error.rawError.errors)[0]._errors[0].message);
        } else {
            console.error(cliColor.cyanBright("[PSS] ") + cliColor.redBright("Discord Error"), error);
        }
        process.exit();
    } catch (err) {
        console.error(error)
        process.exit();
    }
}