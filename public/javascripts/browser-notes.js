// browser-app.js
let id = document.URL.substring(document.URL.lastIndexOf('lists/') + 6);

const data = {
    notes: [],
    _nameFilter: "",
    pages: [],

    get nameFilter() {
        return this._nameFilter.toLowerCase().trim();
    },
    set nameFilter(value) {
        this._nameFilter = value;
        Ui.setNotesFilter(this.nameFilter);
        Ui.renderNotes(this.filteredNotes, this.pages);
    },

    // computed property
    get filteredNotes() {
        const filterText = this.nameFilter;
        return !filterText
            ? this.notes
            : this.notes.filter(x =>
                x.title.toLowerCase()
                    .includes(filterText));
    },

    setNotes(notes) {
        this.notes = notes;
        Ui.renderNotes(this.filteredNotes, this.pages);
    },
    setPages(curPage, numOfPages, notes)
    {
        this.pages = [];
        if(numOfPages !== 1 && numOfPages !== 0)
        {
            if(curPage !== 1) 
            {
                let i = curPage - 1;
                this.pages.push({numOfPage: i, strPage: "Previous"});
            }
            for(let i = 1; i <= numOfPages; i++)
            {
                if(i === curPage)
                    this.pages.push({numOfPage: i, strPage: i, active: 'active'});
                else
                    this.pages.push({numOfPage: i, strPage: i});
            }
            if(curPage !== numOfPages) 
            {
                let i = curPage + 1;
                this.pages.push({numOfPage: i, strPage: "Next"});
            }
        }
        data.setNotes(notes);
    },
    addNotes(note) { 
        this.notes.push(note); 
        Ui.renderNotes(this.filteredNotes, this.pages);
    },
    removeNotes(noteId) { 
        this.notes = this.notes.filter(x => x.id !== noteId); 
        Ui.renderNotes(this.filteredNotes, this.pages);
    },
};

window.addEventListener('load', async (le) => {
    await Ui.loadNoteTemplate();
    await Ui.loadPaginationTemplate();
    fetch(`/api/v1/${id}`)
        .then(json => json.text())
        .then(json =>
        {
            json = JSON.parse(json);
            data.setPages(json.curPage, json.pages, json.notes);
        });
});

function myPag(page)
{
    fetch(`/api/v1/${id}?page=${page}`)
    .then(json => json.text())
    .then(json =>
    {
        json = JSON.parse(json);
        data.setPages(json.curPage, json.pages, json.notes);
    });
}

Ui.filterNotesInputEl.addEventListener('input', (e) => { data.nameFilter = e.target.value; });
Ui.clearNotesFilterEl.addEventListener('click', (e) => { data.nameFilter = ''; });


