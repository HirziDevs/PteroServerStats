const config = require("./configuration.js");
const axios = require("axios");

module.exports = async function getWingsStatus() {
    return axios.get(`${process.env.PanelURL}/api/client/servers/${process.env.ServerID}/resources`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PanelKEY}`,
        },
    })
        .then((res) => res.data.attributes)
        .catch((error) => {
            if (config.log_error) console.error(error);
            return false
        })
}