// browser-app.js
//let id = document.URL.substring(document.URL.lastIndexOf('/lists') + 6);

const data = {
    lists: [],
    users: [],
    users_lists: [],
    _nameFilter: "",

    get nameFilter() {
        return this._nameFilter.toLowerCase().trim();
    },
    set nameFilter(value) {
        this._nameFilter = value;
        Ui.setPublicFilter(this.nameFilter);
        Ui.renderPublic(this.filteredUsers_lists);
    },

    // computed property
    get filteredUsers_lists() {
        const filterText = this.nameFilter;
        return !filterText
            ? this.users_lists
            : this.users_lists.filter(x =>
                x.list.title.toLowerCase()
                    .includes(filterText));
    },

    setLists(lists) {
        this.lists = lists;
        data.setUsers_lists();
        //Ui.renderPublic(this.filteredLists);
    },
    setUsers_lists()
    {
        fetch('/api/v1/allUsers')
            .then(json => json.text())
            .then(json =>
            {
                json = JSON.parse(json);
                this.users = json.users;
                for(let i = 0; i < this.lists.length; i++)
                {
                    let list = this.lists[i];
                    for(let j = 0; j < this.users.length; j++)
                    {
                        let user = this.users[j];
                        if(String(list.userId) === String(user._id))
                            this.users_lists.push({ user: user, list: list});
                    }
                }

                Ui.renderPublic(this.filteredUsers_lists);
            });
    }
};

window.addEventListener('load', async (le) => {
    await Ui.loadPublicListTemplate();
    //await Ui.loadPaginationTemplate();
    // let json = await fetch('/api/v1/public');
    // console.log(json.text());
    fetch(`/api/v1/public`)
        .then(json => json.text())
        .then(json =>
        {
            json = JSON.parse(json);
            data.setLists(json.lists);
        });
});


Ui.filterPublicListsInputEl.addEventListener('input', (e) => { data.nameFilter = e.target.value; });
Ui.clearPublicListsFilterEl.addEventListener('click', (e) => { data.nameFilter = '';});


