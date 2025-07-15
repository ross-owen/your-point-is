require('dotenv').config()

async function buildDashboard(req, res) {
    res.render("dashboard/index", {title: "Dashboard"})
}

module.exports = {
    buildDashboard,
}