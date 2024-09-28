const { EmbedBuilder, time } = require("discord.js");
const cliColor = require("cli-color");
const bytes = require("bytes");
const config = require("./configuration.js");
const uptimeFormatter = require("./uptimeFormatter.js");

module.exports = async function sendMessage(client, server) {
	const channel = await client.channels.fetch(process.env.DiscordChannel);

	const messages = await channel.messages.fetch({ limit: 10 });
	const message = messages.find((msg) => msg.author.id === client.user.id);

	const embed = new EmbedBuilder()
		.setAuthor({ name: config.embed.author.name || null, iconURL: config.embed.author.icon || null })
		.setTitle(config.embed.title || null)
		.setDescription(config.embed.description.replace("{{time}}", time(new Date(Date.now() + 10000), "R")) || null)
		.setColor(config.embed.color || null)
		.setImage(config.embed.image || null)
		.setTimestamp(config.embed.timestamp ? new Date() : null)
		.setThumbnail(config.embed.thumbnail || null)
		.setFooter({ text: config.embed.footer.text || null, iconURL: config.embed.footer.icon || null })
		.addFields({ name: "Status", value: ["starting", "running"].includes(server.stats.current_state) ? config.status.online : config.status.offline });

	if (config.server.details) {
		if (config.server.memory)
			embed.addFields({ inline: true, name: "Memory Usage", value: `\`${bytes.format(server.stats.resources.memory_bytes)}\` / \`${server.details.limits.memory === 0 ? "∞" : bytes(server.details.limits.memory * 1000000)}\`` });
		if (config.server.disk)
			embed.addFields({ inline: true, name: "Disk Usage", value: `\`${bytes.format(server.stats.resources.disk_bytes)}\` / \`${server.details.limits.disk === 0 ? "∞" : bytes(server.details.limits.disk * 1000000)}\`` });
		if (config.server.cpu)
			embed.addFields({ inline: true, name: "CPU Load", value: `\`${server.stats.resources.cpu_absolute.toFixed(2)}%\`` });
		if (config.server.network)
			embed.addFields({ inline: true, name: "Network", value: `Upload: \`${bytes.format(server.stats.resources.network_rx_bytes)}\`\nDownload: \`${bytes.format(server.stats.resources.network_tx_bytes)}\`` });
		if (config.server.uptime)
			embed.addFields({ inline: true, name: "Uptime", value: `\`${uptimeFormatter(server.stats.resources.uptime)}\`` });
	}

	await message?.edit({ embeds: [embed] }) || channel.send({ embeds: [embed] });
	console.log(
		cliColor.cyanBright("[PSS] ") + cliColor.green(`Server stats successfully posted to the ${cliColor.blueBright(channel.name)} channel!`)
	);
}