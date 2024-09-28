const getServerDetails = require("./getServerDetails.js");
const getServerStats = require("./getServerStats.js");
const promiseTimeout = require("./promiseTimeout.js");
const sendMessage = require("./sendMessage.js");
const { EmbedBuilder } = require("discord.js");
const config = require("./configuration.js");
const webhook = require("./webhook.js");
const cliColor = require("cli-color");
const path = require("node:path");
const fs = require("node:fs");

module.exports = async function getStats(client) {
    try {
	    let cache = (() => {
            try {
                return JSON.parse(fs.readFileSync(path.join(__dirname, "../cache.json")))
            } catch {
                return false
            }
        })()
		
        console.log(cliColor.cyanBright("[PSS] ") + cliColor.yellow("Fetching server details..."))
        const details = await promiseTimeout(getServerDetails(), config.timeout * 1000);
        if (!details) throw new Error("Failed to get server details");

        console.log(cliColor.cyanBright("[PSS] ") + cliColor.yellow("Fetching server resources..."))
        const stats = await promiseTimeout(getServerStats(), config.timeout * 1000);

		if (stats.current_state === "missing" && cache?.stats.current_state !== "missing") webhook(
			new EmbedBuilder()
			    .setTitle("Server down")
				.setColor("ED4245")
                .setDescription(`Server is down.`)
		) else if (stats.current_state !== "missing" && cache?.stats.current_state === "missing") webhook(
			new EmbedBuilder()
			    .setTitle("Server up")
				.setColor("57F287")
                .setDescription(`Server is back online.`)
		)
		
        const data = {
            details,
            stats,
            timestamp: Date.now()
        }

        fs.writeFileSync("cache.json", JSON.stringify(data, null, 2), "utf8");

        sendMessage(client, data)
        return data
    } catch (error) {
        if (config.log_error) console.error(error)
        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("Server is currently offline."));

        if (fs.existsSync("cache.json")) {
            try {
                const data = JSON.parse(fs.readFileSync("cache.json"));
                data.stats = {
                    current_state: 'missing',
                    is_suspended: false,
                    resources: {
                        memory_bytes: 0,
                        cpu_absolute: 0,
                        disk_bytes: 0,
                        network_rx_bytes: 0,
                        network_tx_bytes: 0,
                        uptime: 0
                    }
                }

                sendMessage(client, data)
                return data
            } catch {
                console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("Something went wrong with cache data..."));
                return null
            }
        } else {
            console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("Last cache was not found!"));
            return null
        }
    }
}