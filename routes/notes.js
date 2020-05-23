const express = require('express');

const Note = require("../models/note");
const List = require("../models/list");
const Telegram = require('../models/telegram');

const busboyBodyParser = require('busboy-body-parser');

const config = require('../config');

const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});

const router = express.Router();

router.use(busboyBodyParser());

const itemsOnPage = 5;

router.get('/public', checkAuth, function(req, res)
{
    let admin = false;
    if(req.user) 
        admin = req.user.role === "Admin";

    res.render('publiclists', { user: req.user, admin: admin });
});
 
router.get('/lists/:listId/notes', checkAuth, function(req, res)
{
    List.getById(req.params.listId)
        .then(list =>
        {
            let admin = false;
            if(req.user) 
                admin = req.user.role === "Admin";

            let author = String(req.user._id) === String(list.userId);
        
            res.render('notes', { list: list, user: req.user, admin: admin, author: author});
        });
});

router.get('/lists/:listId/notes/new', checkAuth, function(req, res)
{
    let admin = false;
    if(req.user) 
        admin = req.user.role === "Admin";

    res.render("newnote", { listId: req.params.listId, user: req.user, admin: admin });
});

router.post('/lists/:listId/notes/delete', checkAuth, async function(req, res)
{
    let list = await List.getById(req.params.listId);
    List.delete(req.params.listId)
        .then(async () =>
        {
            try
            {
                await Telegram.sentNotificationToOneUser(req.user._id, `You deleted your list: ${list.title}!`);
                res.redirect('/lists');
            } 
            catch (err)
            {
                console.log(err.toString());
                res.status(500).send(err.toString());
            }

        })
        .catch(err => res.status(500).send(err.toString()));
});

router.get('/lists/:listId/notes/update', checkAuth, function(req, res)
{
    let admin = false;
    if(req.user) 
        admin = req.user.role === "Admin";

    List.getById(req.params.listId)
        .then(list => 
        {
            let publicAc = list.access === "public";
            res.render("updatelist", { list, user: req.user, admin: admin, public: publicAc});
        })
        .catch(err => res.status(500).send(err.toString()));
});

router.post('/lists/:listId/notes/update', checkAuth, function(req, res)
{
    List.update(req.params.listId, req.body.nTitle, req.body.description, parseInt(req.body.importance), Date(), req.body.access)
        .then(async list =>
        {
            try
            {
                await Telegram.sentNotificationToOneUser(req.user._id, `You updated your list: ${req.body.nTitle}!`);
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

router.post('/lists/:listId/notes/new', checkAuth, async function(req, res)
{
    let list = await List.getById(req.params.listId);
    const file = req.files.file;

    if(file)
        cloudinary.v2.uploader.upload_stream({ resource_type: 'auto' }, function(error, result)
        { 
            Note.insert(new Note(req.params.listId, req.body.nTitle, req.body.note, req.user._id, parseInt(req.body.importance), req.body.note.length, result.url, file.name, Date()))
                .then(async note =>
                {
                    try
                    {
                        await Telegram.sentNotificationToOneUser(req.user._id, `You created new note \"${req.body.nTitle}\" in your list: ${list.title}!`);
                        res.redirect('/lists/'+ req.params.listId + '/notes/' + note._id);
                    }   
                    catch (err)
                    {
                        console.log(err.toString());
                        res.status(500).send(err.toString());
                    }

                })
                .catch(err => res.status(500).send(err.toString()));
        })
        .end(file.data);
    else
        Note.insert(new Note(req.params.listId, req.body.nTitle, req.body.note, req.user._id, parseInt(req.body.importance), req.body.note.length, "", "No file", Date()))
            .then(async note =>
            {
                try
                {
                    await Telegram.sentNotificationToOneUser(req.user._id, `You created new note \"${req.body.nTitle}\" in your list: ${list.title}!`);
                    res.redirect('/lists/'+ req.params.listId + '/notes/' + note._id);
                }   
                catch (err)
                {
                    console.log(err.toString());
                    res.status(500).send(err.toString());
                }
            })
            .catch(err => res.status(500).send(err.toString()));
});

router.get('/lists/:listId/notes/:noteId/update', checkAuth, function(req, res)
{
    let admin = false;
    if(req.user) 
        admin = req.user.role === "Admin";

    Note.getById(req.params.noteId)
        .then(note => res.render("updatenote", { note, listId: req.params.noteId, user: req.user, admin: admin }))
        .catch(err => res.status(500).send(err.toString()));
});

router.post('/lists/:listId/notes/:noteId/update', checkAuth, async function(req, res)
{
    let oldNote = await Note.getById(req.params.noteId);
    Note.update(req.params.noteId, req.body.nTitle, req.body.note, parseInt(req.body.importance), req.body.note.length, Date())
        .then(async note =>
        {
            try
            {
                await Telegram.sentNotificationToOneUser(req.user._id, `You updated your note: ${oldNote.title}!`);
                res.redirect('/lists/' + req.params.listId + '/notes/' + note._id);
            }   
            catch (err)
            {
                console.log(err.toString());
                res.status(500).send(err.toString());
            }

        })
        .catch(err => res.status(500).send(err.toString()));
});


router.get('/lists/:listId/notes/:noteId', checkAuth, function(req, res)
{
    let admin = false;
    if(req.user) 
        admin = req.user.role === "Admin";

    Note.getById(req.params.noteId)
        .then(note => res.render('note', { note: note, listId: req.params.listId, user: req.user, admin: admin, author: String(req.user._id) === String(note.user) }))
        .catch(err => res.status(500).send(err.toString()));
});

router.post('/lists/:listId/notes/:noteId/delete', checkAuth, async function(req, res)
{
    let note = await Note.getById(req.params.noteId);
    Note.delete(req.params.noteId)
        .then(async () =>
        {
            try
            {
                await Telegram.sentNotificationToOneUser(req.user._id, `You deleted your note: ${note.title}!`);
                res.redirect('/lists/'+ req.params.listId + '/notes');
            }   
            catch (err)
            {
                console.log(err.toString());
                res.status(500).send(err.toString());
            }

        })
        .catch(err => res.status(500).send(err.toString()));
});

function checkAuth(req, res, next) {
    if (!req.user) return res.redirect('/'); // 'Not authorized'
    next();  // пропускати далі тільки аутентифікованих
}
 
module.exports = router;