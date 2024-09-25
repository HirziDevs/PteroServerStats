const fs = require("node:fs");
const yaml = require("js-yaml");
const cliColor = require("cli-color");

console.log(cliColor.cyanBright("[PSS] ") + cliColor.yellow("Loading configuration..."));

let config = yaml.load(fs.readFileSync("./config.yml", "utf8"));
if (fs.existsSync("config-dev.yml")) {
    console.log(cliColor.cyanBright("[PSS] ") + cliColor.yellow("Using development configuration..."));
    config = yaml.load(fs.readFileSync("./config-dev.yml", "utf8"));
}

try {
    const testURL = new URL(process.env?.PanelURL);
    if (!testURL.protocol.startsWith("http")) throw new Error();
} catch {
    console.error('Config Error | Invalid URL Format! Example Correct URL: "https://panel.example.com"');
    process.exit();
}

if (config.version !== 1) {
    console.error('Config Error | Invalid config version! The config has been updated. Please get the new config format from: \n>> https://github.com/HirziDevs/PteroStats/blob/main/config.yml <<');
    process.exit();
}

console.log(cliColor.cyanBright("[PSS] ") + cliColor.yellow("Configuration loaded"));

module.exports = config;