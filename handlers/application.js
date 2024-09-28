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