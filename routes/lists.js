const express = require('express');

const List = require("../models/list");
const Telegram = require('../models/telegram');

const busboyBodyParser = require('busboy-body-parser');

const router = express.Router();

router.use(busboyBodyParser());

const itemsOnPage = 5;
 
router.get('/', checkAuth, function(req, res)
{
    let admin = false;
    if(req.user) 
        admin = req.user.role === "Admin";

    res.render('lists', { user: req.user, admin: admin });
});

router.get('/new', checkAuth, function(req, res)
{
    let admin = false;
    if(req.user) 
        admin = req.user.role === "Admin";

    res.render("newlist", { user: req.user, admin: admin });
});

router.post('/new', checkAuth, function(req, res)
{
    List.insert(new List(req.body.nTitle, req.user._id, req.body.description, parseInt(req.body.importance), Date(), req.body.access))
        .then(async list =>
        {
            try
            {
                await Telegram.sentNotificationToOneUser(req.user._id, `You created new list: ${req.body.nTitle}`);
                res.redirect('/lists/' + list._id + '/notes');
            } 
            catch (err)
            {
                console.log(err.toString());
                res.status(500).send(err.toString());
            }

        })
        .catch(err => res.status(500).send(err.toString()));
});


router.get('/:id', checkAuth, function(req, res)
{
    List.getById(req.params.id)
        .then(list => 
        {
            if(String(req.user._id) !== String(list.userId)) res.redirect('/');
            res.redirect('/lists/' + req.params.id + '/notes');
        })
        .catch(err => res.status(500).send(err.toString()));
});

function checkAuth(req, res, next) {
    if (!req.user) return res.redirect('/'); // 'Not authorized'
    next();  // пропускати далі тільки аутентифікованих
}
 
module.exports = router;