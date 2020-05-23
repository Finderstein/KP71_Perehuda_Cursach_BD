const express = require('express');

const config = require('../config');

const User = require("../models/user");
const Note = require("../models/note");
const List = require("../models/list");


const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});

const itemsOnPage = 4;

const router = express.Router();

const busboyBodyParser = require('busboy-body-parser');
router.use(busboyBodyParser());

const crypto = require('crypto');
const passport = require('passport');
const BasicStrategy = require('passport-http').BasicStrategy;

function sha512(password, salt){
    const hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    const value = hash.digest('hex');
    return {
        salt: salt,
        passwordHash: value
    };
};

passport.use(new BasicStrategy(
    function(userid, password, done)
    {
        User.findByLoginAndPas(userid, sha512(password, config.ServerSalt).passwordHash)
        .then(user =>
        {
            if (!user) done(null, false);
            else done(null, user);
        })
        .catch(err => done(err, null));
    }
));

//USERS CRUD
router.get('/allUsers', function(req, res, next)
{
    if (!req.user && !checkAdmin) { 
        const basicAuthMiddleware = passport.authenticate('basic', { session: false });
        return basicAuthMiddleware(req, res, next); 
    }
    next();
},
(req, res) =>
{
    User.getAll()
        .then(users =>
        {
            res.json({numberOfItems: users.length, users: users});
        })
        .catch(err => res.status(500).json({error: err.toString()}));
});


router.get('/users', function(req, res, next)
{
    if (!req.user && !checkAdmin) { 
        const basicAuthMiddleware = passport.authenticate('basic', { session: false });
        return basicAuthMiddleware(req, res, next); 
    }
    next();
},
(req, res) =>
{
    User.getAll()
        .then(users =>
        {
            let usersOnPage = [];

            let len = users.length;
            let paramPage = 1;
            if(req.query.page) paramPage = parseInt(req.query.page);
            if(!req.query.search || req.query.search === "")
            {
                let numOfPages = Math.ceil(len/itemsOnPage);
                for(let i = 0; itemsOnPage*(paramPage - 1) + i < len && i < itemsOnPage; i++)
                {
                    usersOnPage.push(users[itemsOnPage*(paramPage - 1) + i]);
                }

                if(numOfPages === 0) numOfPages = 1;
                if(paramPage > numOfPages && numOfPages !== 0) return res.status(404).json({error: "Page doesn't exist"});
                res.json({numberOfItems: users.length, pages: numOfPages , curPage: paramPage, search: "", users: usersOnPage});
            }
            else
            {
                let str = req.query.search.toString();
                let searchUsers = [];
                for(let i = 0; i < len; i++)
                {
                    let username = users[i].login.toString();
                    
                    if(username.indexOf(str) !== -1)
                    {
                        searchUsers.push(users[i]);
                    }
                }

                let searchLen = searchUsers.length;
                let numOfPages = Math.ceil(searchLen/itemsOnPage);

                for(let i = 0; itemsOnPage*(paramPage - 1) + i < searchLen && i < itemsOnPage; i++)
                {
                    usersOnPage.push(searchUsers[itemsOnPage*(paramPage - 1) + i]);
                }
                if(numOfPages === 0) numOfPages = 1;
                if(paramPage > numOfPages && numOfPages !== 0) return res.status(404).json({error: "Page doesn't exist"});
                res.json({numberOfItems: users.length, pages: numOfPages , curPage: paramPage, search: str, users: usersOnPage});
            }
        })
        .catch(err => res.status(500).json({error: err.toString()}));
});

router.get('/users/:id', passport.authenticate('basic', { session: false }), checkAuth, function(req, res)
{
    if(req.user.role !== "Admin" && String(req.user._id) !== String(req.params.id)) return res.status(403).json({ error: "Insufficient access rights"});
    User.getById(req.params.id)
        .then(user => res.json(user))
        .catch(err => res.status(500).json({error: err.toString()}));
});

router.post('/users', function(req, res)
{
    if(!req.body.username && !req.body.password && !req.body.repeat_password && !req.body.fullname && !req.body.bio && !req.body.password !== req.body.repeat_password)
        return res.status(400).json({ error: "Bad properties"});

    const file = req.files.avatar;

    if(file)
        cloudinary.v2.uploader.upload_stream({ resource_type: 'auto' }, function(error, result)
        { 
            User.insert(new User(req.body.username, req.body.password, "User", req.body.fullname, req.body.bio, Date(), result.url, false))
                .then(user => res.status(201).json(user))
                .catch(err => res.status(500).json({error: err.toString()}));
        })
        .end(file.data);
    else
        User.insert(new User(req.body.username, req.body.password, "User", req.body.fullname, req.body.bio, Date(), "/images/users/no_ava.png", false))
            .then(user => res.status(201).json(user))
            .catch(err => res.status(500).json({error: err.toString()}));
});

router.put('/users/:id', passport.authenticate('basic', { session: false }), checkAuth, function(req, res)
{
    if(!req.body.fullname && !req.body.bio && !req.files.avatar)
        return res.status(400).json({ error: "Bad properties"});

    if(String(req.user._id) !== String(req.params.id)) return res.status(403).json({ error: "Insufficient access rights"});
    User.getById(req.params.id)
        .then(userInfo =>
        {
            userInfo.fullname = req.body.fullname;
            userInfo.bio = req.body.bio;

            const file = req.files.avatar;
            if(file)
                cloudinary.v2.uploader.upload_stream({ resource_type: 'auto' }, function(error, result)
                { 
                    userInfo.avaUrl = result.url;
                    return User.update(userInfo._id, userInfo)
                        .then(user => res.json(user))
                        .catch(err => res.status(500).json({error: err.toString()}));
                })
                .end(file.data);
            else User.update(userInfo._id, userInfo)
                .then(user => res.json(user))
                .catch(err => res.status(500).json({error: err.toString()}));
        })
        .catch(err => res.status(500).json({error: err.toString()}));
});

router.put('/users/:id/role', passport.authenticate('basic', { session: false }), checkAdmin, function(req, res)
{
    if(!req.body.role && req.body.role !== "Admin" && req.body.role !== "User") return res.status(400).json({error: "Invalid role"});
    User.getById(req.params.id)
        .then(userInfo =>
        {
            userInfo.role = req.body.role;
            return User.update(userInfo._id, userInfo);
        })
        .then(user => res.json(user))
        .catch(err => res.status(500).json({error: err.toString()}));
});

router.put('/users/:id/enabled', passport.authenticate('basic', { session: false }), checkAdmin, function(req, res)
{
    if(!req.body.isDisabled && req.body.isDisabled !== "true" && req.body.isDisabled !== "false") return res.status(400).json({error: "Invalid status(isDisabled)"});
    User.getById(req.params.id)
        .then(userInfo =>
        {
            userInfo.isDisabled = req.body.isDisabled === "true";
            return User.update(userInfo._id, userInfo);
        })
        .then(user => res.json(user))
        .catch(err => res.status(500).json({error: err.toString()}));
});

//Lists CRUD
router.get('/lists', function(req, res, next)
{
    if (!req.user) { 
        const basicAuthMiddleware = passport.authenticate('basic', { session: false });
        return basicAuthMiddleware(req, res, next); 
    }
    next();
},
(req, res) =>
{
    List.getAll(req.user._id)
        .then(lists =>
        {
            let listsOnPage = [];

            let len = lists.length;
            let paramPage = 1;
            if(req.query.page) paramPage = parseInt(req.query.page);
            if(!req.query.search || req.query.search === "")
            {
                let numOfPages = Math.ceil(len/itemsOnPage);
                for(let i = 0; itemsOnPage*(paramPage - 1) + i < len && i < itemsOnPage; i++)
                {
                    listsOnPage.push(lists[itemsOnPage*(paramPage - 1) + i]);
                }
                if(numOfPages === 0) numOfPages = 1;
                if(paramPage > numOfPages && numOfPages !== 0) return res.status(404).json({error: "Page doesn't exist"});
                res.json({numberOfItems: lists.length, pages: numOfPages , curPage: paramPage, search: "", lists: listsOnPage});
            }
            else
            {
                let str = req.query.search.toString();
                let searchLists = [];
                for(let i = 0; i < len; i++)
                {
                    let title = lists[i].title.toString();
                    
                    if(title.indexOf(str) !== -1)
                    {
                        searchLists.push(lists[i]);
                    }
                }

                let searchLen = searchLists.length;
                let numOfPages = Math.ceil(searchLen/itemsOnPage);

                for(let i = 0; itemsOnPage*(paramPage - 1) + i < searchLen && i < itemsOnPage; i++)
                {
                    listsOnPage.push(searchLists[itemsOnPage*(paramPage - 1) + i]);
                }
                if(numOfPages === 0) numOfPages = 1;
                if(paramPage > numOfPages && numOfPages !== 0) return res.status(404).json({error: "Page doesn't exist"});
                res.json({numberOfItems: lists.length, pages: numOfPages , curPage: paramPage, search: str, lists: listsOnPage});
            }
        })
        .catch(err => res.status(500).json({error: err.toString()}));
});

router.get('/public', function(req, res, next)
{
    if (!req.user) { 
        const basicAuthMiddleware = passport.authenticate('basic', { session: false });
        return basicAuthMiddleware(req, res, next); 
    }
    next();
},
(req, res) =>
{
    List.getPublic()
        .then(lists =>
        {
            if(!req.query.search || req.query.search === "")
            {
                res.json({numberOfItems: lists.length, search: "", lists: lists});
            }
            else
            {
                let str = req.query.search.toString();
                let searchLists = [];
                for(let i = 0; i < len; i++)
                {
                    let title = lists[i].title.toString();
                    
                    if(title.indexOf(str) !== -1)
                    {
                        searchLists.push(lists[i]);
                    }
                }

                res.json({numberOfItems: searchLists.length, search: str, lists: searchLists});
            }
        })
        .catch(err => res.status(500).json({error: err.toString()}));
});

router.get('/lists/:id', passport.authenticate('basic', { session: false }), checkAuth, function(req, res)
{
    List.getById(req.params.id)
        .then(list =>
        {
            if(String(req.user._id) !== String(list.userId)) return res.status(403).json({ error: "Insufficient access rights"});
            res.json(list);
        })
        .catch(err => res.status(500).json({error: err.toString()}));
});

router.post('/lists', passport.authenticate('basic', { session: false }), checkAuth, function(req, res)
{
    if(!req.body.title && !req.body.description && !req.body.importance && !req.body.typeOfAccess && (req.body.typeOfAccess !== "public" && req.body.typeOfAccess !== "private"))
        return res.status(400).json({ error: "Bad properties"});

        List.insert(new List(req.body.title, req.user._id, req.body.description, req.body.importance, Date(), req.body.typeOfAccess))
            .then(list => res.status(201).json(list))
            .catch(err => res.status(500).json({error: err.toString()}));
});

router.put('/lists/:id', passport.authenticate('basic', { session: false }), checkAuth, function(req, res)
{
    if(!req.body.title && !req.body.description && !req.body.importance && !req.body.typeOfAccess && (req.body.typeOfAccess !== "public" && req.body.typeOfAccess !== "private"))
        return res.status(400).json({ error: "Bad properties"});

    List.getById(req.params.id)
        .then(listInfo =>
        {
            if(String(req.user._id) !== String(listInfo.userId)) return res.status(403).json({ error: "Insufficient access rights"});

            List.update(listInfo._id, req.body.title, req.body.description, req.body.importance, Date(), req.body.typeOfAccess)
                .then(user => res.json(user))
                .catch(err => res.status(500).json({error: err.toString()}));
        })
        .catch(err => res.status(500).json({error: err.toString()}));
});


router.delete('/lists/:id/', passport.authenticate('basic', { session: false }), checkAuth, function(req, res)
{
    List.getById(req.params.id)
        .then(listInfo =>
        {
            if(String(req.user._id) !== String(listInfo.userId)) return res.status(403).json({ error: "Insufficient access rights"});
            return List.delete(listInfo._id);
        })
        .then(() => res.json({message: "Deleting is successful"}))
        .catch(err => res.status(500).json({error: err.toString()}));
});

//Notes CRUD
router.get('/:listId/notes', function(req, res, next)
{
    if (!req.user) { 
        const basicAuthMiddleware = passport.authenticate('basic', { session: false });
        return basicAuthMiddleware(req, res, next); 
    }
    next();
},
(req, res) =>
{
    Note.getAll(req.params.listId)
        .then(notes =>
        {
            let notesOnPage = [];

            let len = notes.length;
            let paramPage = 1;
            if(req.query.page) paramPage = parseInt(req.query.page);
            if(!req.query.search || req.query.search === "")
            {
                let numOfPages = Math.ceil(len/itemsOnPage);
                for(let i = 0; itemsOnPage*(paramPage - 1) + i < len && i < itemsOnPage; i++)
                {
                    notesOnPage.push(notes[itemsOnPage*(paramPage - 1) + i]);
                }
                if(numOfPages === 0) numOfPages = 1;
                if(paramPage > numOfPages && numOfPages !== 0) return res.status(404).json({error: "Page doesn't exist"});
                res.json({numberOfItems: notes.length, pages: numOfPages , curPage: paramPage, search: "", notes: notesOnPage});
            }
            else
            {
                let str = req.query.search.toString();
                let searchNotes = [];
                for(let i = 0; i < len; i++)
                {
                    let title = notes[i].title.toString();
                    
                    if(title.indexOf(str) !== -1)
                    {
                        searchNotes.push(notes[i]);
                    }
                }

                let searchLen = searchNotes.length;
                let numOfPages = Math.ceil(searchLen/itemsOnPage);

                for(let i = 0; itemsOnPage*(paramPage - 1) + i < searchLen && i < itemsOnPage; i++)
                {
                    notesOnPage.push(searchNotes[itemsOnPage*(paramPage - 1) + i]);
                }
                if(numOfPages === 0) numOfPages = 1;
                if(paramPage > numOfPages && numOfPages !== 0) return res.status(404).json({error: "Page doesn't exist"});
                res.json({numberOfItems: notes.length, pages: numOfPages , curPage: paramPage, search: str, notes: notesOnPage});
            }
        })
        .catch(err => res.status(500).json({error: err.toString()}));
});

router.get('/:listId/notes/:id', passport.authenticate('basic', { session: false }), checkAuth, function(req, res)
{
    Note.getById(req.params.id)
        .then(note =>
        {
            res.json(note);
        })
        .catch(err => res.status(500).json({error: err.toString()}));
});

router.post('/:listId/notes', passport.authenticate('basic', { session: false }), checkAuth, function(req, res)
{
    if(!req.body.title && !req.body.note && !req.body.importance)
        return res.status(400).json({ error: "Bad properties"});

    const file = req.files.file;
    
        if(file)
            cloudinary.v2.uploader.upload_stream({ resource_type: 'auto' }, function(error, result)
            { 
                Note.insert(new Note(req.params.listId, req.body.title, req.body.note, req.user._id, req.body.importance, req.body.note.length, result.url, file.name, Date()))
                    .then(note => res.status(201).json(note))
                    .catch(err => res.status(500).json({error: err.toString()}));
            })
            .end(file.data);
        else
            Note.insert(new Note(req.params.listId, req.body.title, req.body.note, req.user._id, req.body.importance, req.body.note.length, "", "No file", Date()))
                .then(note => res.status(201).json(note))
                .catch(err => res.status(500).json({error: err.toString()}));
});

router.put('/:listId/notes/:id', passport.authenticate('basic', { session: false }), checkAuth, function(req, res)
{
    if(!req.body.title && !req.body.note && !req.body.importance)
        return res.status(400).json({ error: "Bad properties"});

    Note.getById(req.params.id)
        .then(noteInfo =>
        {
            return Note.update(noteInfo._id,req.body.title, req.body.note, req.body.importance, req.body.length, Date());
        })
        .then(note => res.json(note))
        .catch(err => res.status(500).json({error: err.toString()}));
});


router.delete('/:listId/notes/:id', passport.authenticate('basic', { session: false }), checkAuth, function(req, res)
{
    Note.getById(req.params.id)
        .then(noteInfo =>
        {
            return Note.delete(noteInfo._id);
        })
        .then(() => res.json({message: "Deleting is successful"}))
        .catch(err => res.status(500).json({error: err.toString()}));
});


function checkAuth(req, res, next) {
    if(req.err) return res.status(500).json({error: req.err.toString()});
    else if (!req.user) return res.status(401).json({ error: req.err.toString()}); // 'Not authorized'
    next();  // пропускати далі тільки аутентифікованих
}

function checkAdmin(req, res, next) {
    if(req.err) return res.status(500).json({error: req.err.toString()});
    else if (!req.user) res.status(401).json({ error: req.err.toString()}); // 'Not authorized'
    else if (req.user.role !== 'Admin') res.status(403).json({ error: "Insufficient access rights"}); // 'Forbidden'
    else next();  // пропускати далі тільки аутентифікованих із роллю 'admin'
}

module.exports = router;