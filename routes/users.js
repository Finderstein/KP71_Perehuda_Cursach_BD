const express = require('express');

const User = require("../models/user");
const Telegram = require('../models/telegram');

const router = express.Router();

const crypto = require('crypto');
const config = require('../config');

function sha512(password, salt){
    const hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    const value = hash.digest('hex');
    return {
        salt: salt,
        passwordHash: value
    };
};

const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});

router.get('/', checkAdmin, function(req, res)
{
    let admin = false;
    if(req.user) 
        admin = req.user.role === "Admin";  

    User.getAll()
        .then(users => res.render('users', { users, user: req.user, admin: admin }))
        .catch(err => res.status(500).send(err.toString()));
});

router.get('/:id', checkAuth, function(req, res)
{
    let admin = false;
    if(req.user) 
        admin = req.user.role === "Admin";

    User.getById(req.params.id)
        .then(userInfo =>
        {
            let userAdmin = userInfo.role === "Admin";
            let userUser = userInfo.role === "User";
            let author = String(userInfo._id) === String(req.user._id);
            res.render('user', { userInfo, user: req.user, admin: admin, userAdmin: userAdmin, userUser: userUser, author: author });
        })
        .catch(err => res.status(500).send(err.toString()));
});

router.post('/:id', checkAdmin, function(req, res)
{
    User.getById(req.params.id)
        .then(userInfo =>
        {
            userInfo.role = req.body.role;
            if(userInfo.role === "Disabled") userInfo.isDisabled = true;
            else userInfo.isDisabled = false;
            return User.updateWithPas(userInfo._id, userInfo);
        })
        .then(userInfo =>
        {
            res.redirect('/users/' + req.params.id);
        })
        .catch(err => res.status(500).send(err.toString()));
});


router.get('/:id/update', checkAuth, function(req, res)
{
    if(req.user.role !== "Admin" && String(req.user._id) !== String(req.params.id)) return res.redirect('/');
    let admin = false;
    if(req.user) 
        admin = req.user.role === "Admin";

    User.getById(req.params.id)
        .then(userInfo =>
        {
            let userRole = userInfo.role === "Admin";
            let author = userInfo._id === req.user._id;
            res.render('updateuser', { userInfo, user: req.user, admin: admin, userRole: userRole, author: author, err: req.query.error});
        })
        .catch(err => res.status(500).send(err.toString()));
});

router.post('/:id/update', checkAuth, function(req, res)
{
User.getById(req.params.id)
    .then(async user => 
    {
        if(user.chatUsername !== req.body.chatUsername) await User.updateChatId(req.params.id, '');
        const file = req.files.ava;
        if(file)
            cloudinary.v2.uploader.upload_stream({ resource_type: 'auto' }, function(error, result)
            { 
                User.updateWithoutPas(req.params.id, user.login, req.body.fullname, req.body.bio, Date(), result.url, req.body.telegram)
                    .then(async () =>
                    {
                        try
                        {
                            await Telegram.sentNotificationToOneUser(req.user._id, `You updated your profile!`);
                            res.redirect(`/users/${req.params.id}`);
                        }   
                        catch (err)
                        {
                            console.log(err.toString());
                            res.status(500).send(err.toString());
                        }
                    })
                    .catch(() => res.redirect(`/users/${req.params.id}/update?error=Update+error`));

            })
            .end(file.data);
        else
            User.updateWithoutPas(req.params.id, user.login, req.body.fullname, req.body.bio, Date(), user.avaUrl, req.body.telegram)
                .then(async () =>
                {
                    try
                    {
                        await Telegram.sentNotificationToOneUser(req.user._id, `You updated your profile!`);
                        res.redirect(`/users/${req.params.id}`);
                    }   
                    catch (err)
                    {
                        console.log(err.toString());
                        res.status(500).send(err.toString());
                    }
                })
                .catch(() => res.redirect(`/users/${req.params.id}/update?error=Update+error`));


    })
    .catch(err => res.status(500).send(err.toString()));

});

function checkAuth(req, res, next) {
    if (!req.user) return res.redirect('/'); // 'Not authorized'
    next();  // пропускати далі тільки аутентифікованих
}

function checkAdmin(req, res, next) {
    if (!req.user) res.redirect('/'); // 'Not authorized'
    else if (req.user.role !== 'Admin') res.redirect('/'); // 'Forbidden'
    else next();  // пропускати далі тільки аутентифікованих із роллю 'admin'
}

module.exports = router;