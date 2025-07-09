const utilities = require('../utilities')
require('dotenv').config()

async function buildLogin(req, res) {
    res.render('auth/login', {
        title: 'Login',
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