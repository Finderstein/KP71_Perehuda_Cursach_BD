const mongoose = require('mongoose');

mongoose.set('useFindAndModify', false);

const ListShema = new mongoose.Schema({
    title: { type: String, required: true },
    userId: { type: String, required: true },
    description: { type: String, required: true },
    importance: { type: Number, required: true},
    createdAt: { type: String, default: new Date().toISOString() },
    typeOfAccess: { type: String, required: true },
});

const ListModel = mongoose.model('List', ListShema);

const Note = require("./note");

class List
{
    constructor(title, userId, description, importance, createdAt, typeOfAccess)
    {
        this.title = title;
        this.userId = userId;
        this.description = description;
        this.importance = importance;
        this.createdAt = createdAt;
        this.typeOfAccess = typeOfAccess;
    }

    static getById(id)
    {
        return ListModel.findById({ _id: id});
    }
    
    static getAll(userId)
    {
        return ListModel.find({ userId: userId});
    }

    static getPublic()
    {
        return ListModel.find({ typeOfAccess: "public"});
    }

    static insert(list)
    {
        return new ListModel(list).save();
    }

    static update(id, title, description, importance, date, access)
    {
        return ListModel.findByIdAndUpdate(id, 
            { $set: { title: title, description: description, importance: importance, createdAt: date, typeOfAccess: access}});
    }

    static delete(id)
    {
        return ListModel.findByIdAndDelete(id)
            .then(list =>
            {
                return Note.deleteListNotes(list._id);
            });
    }
}

module.exports = List;