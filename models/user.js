const mongoose = require('mongoose');
const crypto = require('crypto');

const UserShema = new mongoose.Schema({
    login: { type: String, required: true },
    password: { type: String, required: true },
    fullname: { type: String, required: true },
    role: { type: String, required: true },
    bio: { type: String },
    registeredAt: { type: String, default: new Date().toISOString() },
    avaUrl: { type: String, default: "/images/users/no_ava.png" },
    chatUsername: { type: String },
    chatId: { type: String },
    isDisabled: { type: Boolean, required: true },
});

const UserModel = mongoose.model('User', UserShema);

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

class User
{
    constructor(login, password, role, fullname, bio, registeredAt, avaUrl, isDisabled)
    {
        this.login = login;
        this.password = sha512(password, config.ServerSalt).passwordHash;
        this.role = role;
        this.fullname = fullname;
        this.bio = bio;
        this.registeredAt = registeredAt;
        this.avaUrl = avaUrl;
        this.chatId = "";
        this.chatUsername = "";
        this.isDisabled = isDisabled;
    }

    static getById(id)
    {
        return UserModel.findById({ _id: id});
    }

    static getByChatUsername(chatUsername)
    {
        return UserModel.findOne({ chatUsername: chatUsername});
    }
    
    static getAll()
    {
        return UserModel.find();
    }

    static insert(user)
    {
        return new UserModel(user).save();
    }

    static updateWithPas(id, user)
    {
        return UserModel.findByIdAndUpdate(id, user);
    }

    static updateWithoutPas(id, login, fullname, bio, registeredAt, avaUrl, chatUsername)
    {
        return UserModel.findByIdAndUpdate(id, { $set: { login: login, fullname: fullname, bio: bio, registeredAt: registeredAt, avaUrl: avaUrl, chatUsername: chatUsername }});
    }

    static updateChatId(id, chatId)
    {
        return UserModel.findByIdAndUpdate(id, { $set: { chatId: chatId }});
    }

    static delete(id)
    {
        return UserModel.findByIdAndDelete(id);
    }

    static findByLogin(login)
    {
        return UserModel.findOne({ login: login });
    }

    static findByLoginAndPas(login, password)
    {
        return UserModel.findOne({ login: login, password: password });
    }
}

module.exports = User;