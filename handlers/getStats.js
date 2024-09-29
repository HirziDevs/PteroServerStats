const getServerDetails = require("./getServerDetails.js");
const getServerStats = require("./getServerStats.js");
const promiseTimeout = require("./promiseTimeout.js");
const sendMessage = require("./sendMessage.js");
const config = require("./configuration.js");
const cliColor = require("cli-color");
const fs = require("node:fs");

module.exports = async function getStats(client) {
    try {
        console.log(cliColor.cyanBright("[PSS] ") + cliColor.yellow("Fetching server details..."))
        const details = await promiseTimeout(getServerDetails(), config.timeout * 1000);
        if (!details) throw new Error("Failed to get server details");

        console.log(cliColor.cyanBright("[PSS] ") + cliColor.yellow("Fetching server resources..."))
        const stats = await promiseTimeout(getServerStats(), config.timeout * 1000);
        if (stats.current_state === "missing") console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("Server is currently down."))
        else console.log(cliColor.cyanBright("[PSS] ") + cliColor.green("Server state is normal."))

        const data = {
            details,
            stats,
            timestamp: Date.now()
        }

        sendMessage(client, data)
        return data
    } catch (error) {
        if (config.log_error) console.error(error)
        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("Server is currently down."));

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