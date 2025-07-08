const jwt = require("jsonwebtoken")
require("dotenv").config()
const Util = {}

Util.getNav = async function (req, res, next) {
    // todo: add functionality to determine if user is logged in or not
    return `<ul>
        <li><a href="/" title="Login page">Login</a></li>
        <li><a href="/auth/logout" title="Sign Out">Sign Out</a></li>
    </ul>`
}

Util.handleErrors = fn => (req, res, next) => Promise
    .resolve(fn(req, res, next))
    .catch(next)

Util.checkJwtToken = (req, res, next) => {
    if (req.cookies.jwt) {
        jwt.verify(
            req.cookies.jwt,
            process.env.JWT_SECRET,
            function (err, accountData) {
                if (err) {
                    req.flash('notice', 'Please log in')
                    res.clearCookie('jwt')
                    return res.redirect('/auth/login')
                }
                res.locals.accountData = accountData
                res.locals.loggedIn = 1
                next()
            }
        )
    } else {
        res.locals.loggedIn = 0
        next()
    }
}

Util.checkLogin = (req, res, next) => {
    if (res.locals.loggedIn) {
        next()
    } else {
        req.flash('notice', 'Please log in')
        return res.redirect('/account/login')
    }
}

Util.canAdminister = (req, res, next) => {
    if (res.locals.accountData &&
        (res.locals.accountData.account_type === 'Admin'
            || res.locals.accountData.account_type === 'Employee')) {
        next();
    } else {
        console.warn('Forbidden. User is not allowed to make modifications.');

        const error = new Error('Forbidden')
        error.status = 403;

        next(error)
    }
};

module.exports = Util