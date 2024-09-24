require("dotenv").config();
const axios = require("axios")

module.exports = function Application() {
    setInterval(() => axios(`${process.env.PanelURL}/api/client/servers/${process.env.ServeID}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.PanelKEY}`
        },
    }).then((res) => {
        console.log(res.data)
    }), 5000)
}