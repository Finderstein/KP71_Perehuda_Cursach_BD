// browser-app.js
//let id = document.URL.substring(document.URL.lastIndexOf('/lists') + 6);

const data = {
    users: [],
    _nameFilter: "",
    pages: [],

    get nameFilter() {
        return this._nameFilter.toLowerCase().trim();
    },
    set nameFilter(value) {
        this._nameFilter = value;
        Ui.setUsersFilter(this.nameFilter);
        Ui.renderUsers(this.filteredUsers, this.pages);
    },

    // computed property
    get filteredUsers() {
        const filterText = this.nameFilter;
        return !filterText
            ? this.users
            : this.users.filter(x =>
                x.login.toLowerCase()
                    .includes(filterText));
    },

    setUsers(users) {
        this.users = users;
        Ui.renderUsers(this.filteredUsers, this.pages);
    },
    setPages(curPage, numOfPages, users)
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
        data.setUsers(users);
    },
    addUser(user) { 
        this.users.push(user); 
        Ui.renderUsers(this.filteredUsers, this.pages);
    },
    removeUser(userId) { 
        this.users = this.users.filter(x => x.id !== userId); 
        Ui.renderUsers(this.filteredUsers, this.pages);
    },
};

window.addEventListener('load', async (le) => {
    await Ui.loadUserTemplate();
    await Ui.loadPaginationTemplate();
    fetch(`/api/v1/users`)
        .then(json => json.text())
        .then(json =>
        {
            json = JSON.parse(json);
            data.setPages(json.curPage, json.pages, json.users);
        });
});


function myPag(page)
{
    fetch(`/api/v1/users?page=${page}`)
    .then(json => json.text())
    .then(json =>
    {
        json = JSON.parse(json);
        data.setPages(json.curPage, json.pages, json.users);
    });
}

Ui.filterUsersInputEl.addEventListener('input', (e) => { data.nameFilter = e.target.value; });
Ui.clearUsersFilterEl.addEventListener('click', (e) => { data.nameFilter = '';});


