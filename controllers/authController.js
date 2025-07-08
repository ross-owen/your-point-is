const utilities = require('../utilities')
require('dotenv').config()

async function buildLogin(req, res) {
    let nav = await utilities.getNav()
    res.render('auth/login', {
        title: 'Login',
        nav,
        errors: null,
    })
}

async function accountLogin(req, res) {
    // todo
}

async function accountLogout(req, res) {
    // todo
    res.redirect('/auth/login')
}

module.exports = {
    buildLogin,
    accountLogin,
    accountLogout,
}