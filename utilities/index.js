require("dotenv").config()
const Util = {}

Util.handleErrors = fn => (req, res, next) => Promise
    .resolve(fn(req, res, next))
    .catch(next)

Util.checkLogin = (req, res, next) => {
    if (res.locals.loggedIn) {
        next()
    } else {
        req.flash('notice', 'Please log in')
        return res.redirect('/auth/login')
    }
}

module.exports = Util