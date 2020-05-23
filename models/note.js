const mongoose = require('mongoose');

const NoteShema = new mongoose.Schema({
    listId: { type: String, required: true },
    title: { type: String, required: true },
    note: { type: String, required: true },
    user: { type: String, required: true },
    importance: { type: Number, required: true },
    length: { type: Number, required: true },
    file_url: { type: String },
    file_name: { type: String },
    dateOfCreation: { type: String, required: true},
});

const NoteModel = mongoose.model('Note', NoteShema);

class Note
{
    constructor(listId, title, note, user, importance, length, file_url, file_name, dateOfCreation)
    {
        this.listId = listId;
        this.title = title;
        this.note = note;
        this.user = user;
        this.importance = importance;
        this.length = length;
        this.file_url = file_url;
        this.file_name = file_name;
        this.dateOfCreation = dateOfCreation;
    }

    static getById(id)
    {
        return NoteModel.findById({ _id: id});
    }
    
    static getAll(listId)
    {
        return NoteModel.find({ listId: listId });
    }

    static insert(note)
    {
        return new NoteModel(note).save();
    }

    static delete(id)
    {
        return NoteModel.findByIdAndDelete(id);
    }

    static deleteListNotes(listId)
    {
        return NoteModel.deleteMany({ listId: listId });
    }

    static update(id, title, note, importance, length, date)
    {
        return NoteModel.findByIdAndUpdate(id, 
            { $set: { title: title, note: note, importance: importance, length: length, dateOfCreation: date }});
    }
}


module.exports = Note;