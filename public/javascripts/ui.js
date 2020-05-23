// ui.js

const Ui = {
    filterListsInputEl: document.getElementById('listsNameFilter'),
    clearListsFilterEl: document.getElementById('clearListsFilter'),
    filteredListsEl: document.getElementById('filteredLists'),
    listsPaginationEl: document.getElementById('listsPagination'),

    filterNotesInputEl: document.getElementById('notesNameFilter'),
    clearNotesFilterEl: document.getElementById('clearNotesFilter'),
    filteredNotesEl: document.getElementById('filteredNotes'),
    notesPaginationEl: document.getElementById('notesPagination'),

    filterUsersInputEl: document.getElementById('usersNameFilter'),
    clearUsersFilterEl: document.getElementById('clearUsersFilter'),
    filteredUsersEl: document.getElementById('filteredUsers'),
    usersPaginationEl: document.getElementById('usersPagination'),

    filterPublicListsInputEl: document.getElementById('publicListsNameFilter'),
    clearPublicListsFilterEl: document.getElementById('clearPublicListsFilter'),
    filteredPublicListsEl: document.getElementById('filteredPublicLists'),

    paginationTemplate: null,
    async loadPaginationTemplate() {
        const response = await fetch('/templates/pagination.mst');
        this.paginationTemplate = await response.text();
    },

    listTemplate: null,
    async loadListTemplate() {
        const response = await fetch('/templates/lists.mst');
        this.listTemplate = await response.text();
    },

    publicTemplate: null,
    async loadPublicListTemplate() {
        const response = await fetch('/templates/publiclists.mst');
        this.publicTemplate = await response.text();
    },

    noteTemplate: null,
    async loadNoteTemplate() {
        const response = await fetch('/templates/notes.mst');
        this.noteTemplate = await response.text();
    },

    userTemplate: null,
    async loadUserTemplate() {
        const response = await fetch('/templates/users.mst');
        this.userTemplate = await response.text();
    },

    setListsFilter(filter) { this.filterListsInputEl.value = filter; },
    setNotesFilter(filter) { this.filterNotesInputEl.value = filter; },
    setUsersFilter(filter) { this.filterUsersInputEl.value = filter; },
    setPublicFilter(filter) { this.filterPublicListsInputEl.value = filter; },

    renderLists(lists, pages) {
        // update DOM
        const templateLists = this.listTemplate;
        const dataLists = { lists: lists};
        const renderedListsHTML = Mustache.render(templateLists, dataLists);
        this.filteredListsEl.innerHTML = renderedListsHTML;

        const templatePag = this.paginationTemplate;
        const dataPag = { pages: pages};
        const renderedPagHtml = Mustache.render(templatePag, dataPag);
        this.listsPaginationEl.innerHTML = renderedPagHtml;
    },

    renderNotes(notes, pages) {
        // update DOM
        const templateNotes = this.noteTemplate;
        let id = document.URL.substring(document.URL.lastIndexOf('lists/') + 6, document.URL.lastIndexOf('/'));
        const dataNotes = { notes: notes, listId: id};
        const renderedNotesHTML = Mustache.render(templateNotes, dataNotes);
        this.filteredNotesEl.innerHTML = renderedNotesHTML;

        const templatePag = this.paginationTemplate;
        const dataPag = { pages: pages };
        const renderedPagHtml = Mustache.render(templatePag, dataPag);
        this.notesPaginationEl.innerHTML = renderedPagHtml;
    },

    renderUsers(users, pages) {
        // update DOM
        const templateUsers = this.userTemplate;
        const dataUsers = { users: users };
        const renderedUsersHTML = Mustache.render(templateUsers, dataUsers);
        this.filteredUsersEl.innerHTML = renderedUsersHTML;

        const templatePag = this.paginationTemplate;
        const dataPag = { pages: pages };
        const renderedPagHtml = Mustache.render(templatePag, dataPag);
        this.notesPaginationEl.innerHTML = renderedPagHtml;
    },

    renderPublic(users_lists) {
        // update DOM
        const templatePublic = this.publicTemplate;
        const dataPublic = { users_lists: users_lists };
        const renderedPublicHTML = Mustache.render(templatePublic, dataPublic);
        this.filteredPublicListsEl.innerHTML = renderedPublicHTML;
    }
};


