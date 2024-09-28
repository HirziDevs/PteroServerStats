const cliColor = require("cli-color");
const axios = require("axios");

module.exports = async function getAllNodes() {
    return axios.get(`${process.env.PanelURL}/api/client/servers/${process.env.ServerID}`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PanelKEY}`,
        },
    })
        .then((res) => res.data.attributes)
        .catch((error) => {
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
            return false
        })
}