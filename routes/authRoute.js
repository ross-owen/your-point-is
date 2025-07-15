const express = require('express')
const router = new express.Router()
const controller = require('../controllers/authController')
const utilities = require('../utilities')
const passport = require('passport')

router.get('/login',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
      res.redirect('/dashboard');
    }
);

router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    req.session.destroy(() => {
      res.redirect('/');
    });
  });
});

router.get('/login', utilities.handleErrors(controller.buildLogin))
router.post('/login', utilities.handleErrors(controller.accountLogin)
)

router.get('/logout', utilities.handleErrors(controller.accountLogout))


module.exports = router
