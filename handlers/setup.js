const axios = require("axios");
const cliColor = require("cli-color");
const { Client, GatewayIntentBits } = require("discord.js");
const fs = require("node:fs");
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});
const uuid = require("uuid")

const questions = [
    "Please enter your panel URL: ",
    "Please enter your panel API key: ",
    "Please enter your discord bot token: ",
    "Please enter your discord channel ID: ",
    "Please enter your panel server ID: "
];

const Question = {
    panelUrl: 0,
    panelApiKey: 1,
    botToken: 2,
    channelId: 3,
    serverID: 4,
}

const answers = [];

const isValidURL = (url) => {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
};

module.exports = function Setup() {
    console.log(cliColor.cyanBright("Welcome to PteroServerStats!"))
    console.log(cliColor.yellow("Please fill in the following credentials to set up the app.\n "));

    const askQuestion = (index) => {
        if (index < questions.length) {
            console.log(questions[index]);

            readline.question('> ', answer => {
                let isValid = true;

                if (index === Question.panelUrl && !isValidURL(answer)) {
                    console.log(cliColor.redBright('❌ Invalid Panel URL. Please enter a valid URL. Example Correct URL: "https://panel.example.com"'));
                    isValid = false;
                } else if (index === Question.panelApiKey && !/^(plcn_|ptlc_|peli_|ptla_)/.test(answer)) {
                    console.log(cliColor.redBright("❌ Invalid Panel API key. It must start with 'plcn_' or 'ptlc_'."));
                    isValid = false;
                } else if (index === Question.channelId && !/^\d+$/.test(answer)) {
                    console.log(cliColor.redBright("❌ Invalid Channel ID. It must be a number."));
                    isValid = false;
                } else if (index === Question.serverID && !uuid.validate(answer)) {
                    console.log(cliColor.redBright("❌ Invalid Panel Server ID."));
                    isValid = false
                }

                if (index === Question.panelApiKey && /^(peli_|ptla_)/.test(answer)) {
                    console.log(cliColor.redBright("❌ Invalid Panel API key. You cannot use Application API Keys."));
                    isValid = false;
                }

                if (isValid) {
                    answers.push(isValidURL(answer) ? new URL(answer).origin : answer);
                    askQuestion(index + 1);
                } else {
                    askQuestion(index);
                }
            });
        } else {
            axios(`${new URL(answers[Question.panelUrl]).origin}/api/client`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${answers[Question.panelApiKey]}`
                },
            }).then(() => {
                console.log(" \n" + cliColor.green("✓ Valid Panel Credentials."));

                axios(`${new URL(answers[Question.panelUrl]).origin}/api/client/servers/${answers[Question.serverID]}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${answers[Question.panelApiKey]}`
                    },
                }).then(() => {
                    console.log(cliColor.green("✓ Valid Panel Server ID."));

                    const client = new Client({
                        intents: [GatewayIntentBits.Guilds]
                    })

                    client.login(answers[Question.botToken]).then(async () => {
                        console.log(cliColor.green("✓ Valid Discord Bot."));
                        client.channels.fetch(answers[Question.channelId]).then(() => {
                            console.log(cliColor.green("✓ Valid Discord Channel."));

                            fs.writeFileSync(".setup-complete", "If you want to re-run the setup process, you can delete this file.", "utf8");

                            fs.writeFileSync(
                                ".env",
                                `PanelURL=${answers[Question.panelUrl]}\n` +
                                `PanelKEY=${answers[Question.panelApiKey]}\n` +
                                `DiscordBotToken=${answers[Question.botToken]}\n` +
                                `DiscordChannel=${answers[Question.channelId]}\n` +
                                `ServerID=${answers[Question.serverID]}`,
                                "utf8"
                            );

                            console.log(" \n" + cliColor.green(`Configuration saved in ${cliColor.blueBright(".env")}.\n `));

                            require("./application.js")()
                        }).catch(() => {
                            console.log(cliColor.redBright("❌ Invalid Channel ID."));
                            console.log(" \n" + cliColor.redBright("Please run the setup again and fill in the correct credentials."));
                            process.exit()
                        })
                    }).catch(() => {
                        console.log(cliColor.redBright("❌ Invalid Discord Bot Token."));
                        console.log(" \n" + cliColor.redBright("Please run the setup again and fill in the correct credentials."));
                        process.exit()
                    })
                }).catch((error) => {
                    console.log(" \n" + cliColor.redBright("❌ Invalid Server ID."));
                    if (error.code === "ENOTFOUND") {
                        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("ENOTFOUND | DNS Error. Ensure your network connection and DNS server are functioning correctly."));
                    } else if (error.code === "ECONNREFUSED") {
                        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("ECONNREFUSED | Connection refused. Ensure the panel is running and reachable."));
                    } else if (error.code === "ETIMEDOUT") {
                        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("ETIMEDOUT | Connection timed out. The panel took too long to respond."));
                    } else if (error.code === "ECONNRESET") {
                        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("ECONNRESET | Connection reset by peer. The panel closed the connection unexpectedly."));
                    } else if (error.code === "EHOSTUNREACH") {
                        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("EHOSTUNREACH | Host unreachable. The panel is down or not reachable."));
                    } else if (error.response) {
                        if (error.response.status === 401) {
                            console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("401 | Unauthorized. Invalid Application Key or API Key doesn't have permission to perform this action."));
                        } else if (error.response.status === 403) {
                            console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("403 | Forbidden. Invalid Application Key or API Key doesn't have permission to perform this action."));
                        } else if (error.response.status === 404) {
                            console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("404 | Not Found. Invalid Panel URL or the Panel doesn't exist."));
                        } else if (error.response.status === 429) {
                            console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("429 | Too Many Requests. You have sent too many requests in a given amount of time."));
                        } else if ([500, 502, 503, 504].includes(error.response.status)) {
                            console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("500 | Internal Server Error. This is an error with your panel, PSS is not the cause."));
                        } else {
                            console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright(`${error.response.status} | Unexpected error: ${error.response.statusText}`));
                        }
                    } else {
                        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright(`Unexpected error: ${error.message}`));
                    }
                    console.log(" \n" + cliColor.redBright("Please run the setup again and fill in the correct credentials."));
                    process.exit()
                })
            }).catch((error) => {
                console.log(" \n" + cliColor.redBright("❌ Invalid Panel Credentials."));
                if (error.code === "ENOTFOUND") {
                    console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("ENOTFOUND | DNS Error. Ensure your network connection and DNS server are functioning correctly."));
                } else if (error.code === "ECONNREFUSED") {
                    console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("ECONNREFUSED | Connection refused. Ensure the panel is running and reachable."));
                } else if (error.code === "ETIMEDOUT") {
                    console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("ETIMEDOUT | Connection timed out. The panel took too long to respond."));
                } else if (error.code === "ECONNRESET") {
                    console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("ECONNRESET | Connection reset by peer. The panel closed the connection unexpectedly."));
                } else if (error.code === "EHOSTUNREACH") {
                    console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("EHOSTUNREACH | Host unreachable. The panel is down or not reachable."));
                } else if (error.response) {
                    if (error.response.status === 401) {
                        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("401 | Unauthorized. Invalid Application Key or API Key doesn't have permission to perform this action."));
                    } else if (error.response.status === 403) {
                        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("403 | Forbidden. Invalid Application Key or API Key doesn't have permission to perform this action."));
                    } else if (error.response.status === 404) {
                        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("404 | Not Found. Invalid Panel URL or the Panel doesn't exist."));
                    } else if (error.response.status === 429) {
                        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("429 | Too Many Requests. You have sent too many requests in a given amount of time."));
                    } else if ([500, 502, 503, 504].includes(error.response.status)) {
                        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright("500 | Internal Server Error. This is an error with your panel, PSS is not the cause."));
                    } else {
                        console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright(`${error.response.status} | Unexpected error: ${error.response.statusText}`));
                    }
                } else {
                    console.log(cliColor.cyanBright("[PSS] ") + cliColor.redBright(`Unexpected error: ${error.message}`));
                }
                console.log(" \n" + cliColor.redBright("Please run the setup again and fill in the correct credentials."));
                process.exit()
            })
        }
    };

    askQuestion(0);
}