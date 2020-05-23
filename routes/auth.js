const express = require('express');

const User = require("../models/user");

const busboyBodyParser = require('busboy-body-parser');

const router = express.Router();

router.use(busboyBodyParser());

const config = require('../config');

const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});

router.get('/register', function(req, res)
{
    if(req.query.error)
        res.render('register', { err: req.query.error, user: req.user });
    else
        res.render('register', {user: req.user});
});


router.post('/register', function(req, res)
{
    if(req.body.password !== req.body.repeat_password)
        res.redirect('/auth/register?error=Repeated+password+uncorrect');
    else
        User.findByLogin(req.body.login)
            .then(user => 
            {
                if(user)
                    res.redirect('/auth/register?error=Username+already+exists');
                else
                {
                    User.insert(new User(req.body.login, req.body.password, "User", "Fullname", "My biography", Date(), "/images/users/no_ava.png", false))
                        .then(() => res.redirect('/auth/login'))
                        .catch(() => res.redirect('/auth/register?error=Registration+error'));
                }
            })
            .catch(err => res.status(500).send(err.toString()));
});

module.exports = router;