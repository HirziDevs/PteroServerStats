const config = require("./configuration.js");
const axios = require("axios");

module.exports = async function getWingsStatus() {
    return axios.get(`${process.env.PanelURL}/api/client/servers/${process.env.ServerID}/resources`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PanelKEY}`,
        },
    })
        .then(({ data: { attributes } }) => {
            return {
                current_state: attributes.current_state,
                resources: attributes.resources
            }
        })
        .catch((error) => {
            if (config.log_error) console.error(error);
            return false
        })
}