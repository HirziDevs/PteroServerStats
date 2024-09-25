require("dotenv").config();
const axios = require("axios");
const bit = require("prettier-bytes");
const WebSocket = require('ws');
const cliColor = require("cli-color");
const bytes = require("bytes");
const UptimeFormatter = require("./UptimeFormatter");
const { Client, GatewayIntentBits, EmbedBuilder, time } = require("discord.js");

module.exports = async function Application() {
	console.log(cliColor.cyanBright("[PSS] ") + cliColor.green(`Fetching server details..`));
	const server = await axios(`${process.env.PanelURL}/api/client/servers/${process.env.ServerID}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.PanelKEY}`
        },
    }).then((res) => {
		console.log(cliColor.cyanBright("[PSS] ") + cliColor.green(`Connected to ${cliColor.yellow(res.data.attributes.name)}`));
		return res.data.attributes
	}).catch((error) => {
		console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright(`Cannot connect to the server`));
		Application()
		return false
	})
	if (!server) return
	
	const client = await Bot()
	if (!client) return
	
	client.once("ready", async () => {
		console.log(cliColor.cyanBright("[PSS] ") + cliColor.green(`${cliColor.yellow(client.user.tag)} is online!`));
	    let ws = await Connect()
	    let date = Date.now()
	
        ws.on('message', async (res) => {
		    const data = JSON.parse(res)
			if (data.event === "auth success") console.log(cliColor.cyanBright("[PSS] ") + cliColor.green(`Server websocket connected!`));
			else if (data.event === "stats") {
			    const resource = JSON.parse(data.args[0])
		
				const channel = await client.channels.fetch(process.env.DiscordChannel)
	    
			    const messages = await channel.messages.fetch({ limit: 10 });
                const botMessage = messages.find(msg => msg.author.id === client.user.id);

			    const embeds = [
				    new EmbedBuilder()
						.setTitle(`Server Stats`)
						.setDescription(`Next update ${time(new Date(Date.now() + 10000), "R")}`)
					    .addFields(
						    {
								name: "State",
								value: resource.state.split("")[0].toUpperCase() + resource.state.slice(1),
							},
						    {
							    name: "Memory Usage",
							    value: `\`${bytes.format(resource.memory_bytes, { unitSeparator: " " })}\` / \`${server.limits.memory === 0 ? "∞`" : bit(server.limits.memory * 1000000) + "`"}`
						    },
						    {
							    name: "Disk Usage",
							    value: `\`${bytes.format(resource.disk_bytes, { unitSeparator: " " })}\` / \`${server.limits.disk === 0 ? "∞`" : bit(server.limits.disk * 1000000) + "`"}`
						    },
						    {
							    name: "CPU Load",
							    value: `\`${resource.cpu_absolute.toFixed(2)}%\``
						    },
							{
								name: "Network",
								value: 
								    `Upload: \`${bytes.format(resource.network.rx_bytes, { unitSeparator: " " })}\`\n` +
									`Download: \`${bytes.format(resource.network.tx_bytes, { unitSeparator: " " })}\`` 
							},
						    {
							    name: "Uptime",
							    value: `\`${UptimeFormatter(resource.uptime)}\``
						    }
					    )
			    ]
			
			    const components = []
			
			    if (Date.now() > date) {
				    date = Date.now() + 10000
                    if (botMessage) {
						console.log(cliColor.cyanBright("[PSS] ") + cliColor.green(`Server stats successfully posted to the ${cliColor.blueBright(channel.name)} channel!`));
        
                        await botMessage.edit({ embeds, components });
                    } else {
						console.log(cliColor.cyanBright("[PSS] ") + cliColor.green(`Server stats successfully posted to the ${cliColor.blueBright(channel.name)} channel!`));

                        await channel.send({ embeds, components });
                    }
			    }
		    } else if (data.event === "console output") console.log(cliColor.yellowBright("[Server] ") + data.args[0])
		    else if (data.event === "status") console.log(cliColor.yellowBright("[Server] ") + data.args[0])
        });    
		
        ws.on('error', (data) => {
            console.error(data)
        }); 
		
        ws.on('close', async(data) => {
			console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright(`Server websocket disconnected`));
            ws = await Connect()
        });
	/*
	readline.question('> ', answer => {
		ws.send(JSON.stringify({ event: "send command", args: [answer] }))
	})
	*/
    })
}

async function Connect() {
	return await axios(`${process.env.PanelURL}/api/client/servers/${process.env.ServerID}/websocket`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.PanelKEY}`
        },
    }).then((res) => {
		console.log(cliColor.cyanBright("[PSS] ") + cliColor.green(`Connecting to server websocket...`));
		
		const ws = new WebSocket(res.data.data.socket, { origin: process.env.PanelURL })
		ws.once('open', () => {
            ws.send(JSON.stringify({ event: "auth", args: [res.data.data.token] }))
        });
		
		return ws
    }).catch(async(error) => {
		console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright(`Server websocket disconnected`));
		return await Connect()
	})
}

async function Bot() {
	const client = new Client({
        intents: [GatewayIntentBits.Guilds]
    })
	
	return await client.login(process.env.DiscordBotToken).then(() => {
		return client
	}).catch((error) => {
		console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright(`Cannot connect to discord bot`));
		Application()
		return false
	})
}