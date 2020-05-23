// browser-app.js
//let id = document.URL.substring(document.URL.lastIndexOf('/lists') + 6);

const data = {
    lists: [],
    _nameFilter: "",
    pages: [],

    get nameFilter() {
        return this._nameFilter.toLowerCase().trim();
    },
    set nameFilter(value) {
        this._nameFilter = value;
        Ui.setListsFilter(this.nameFilter);
        Ui.renderLists(this.filteredLists, this.pages);
    },

    // computed property
    get filteredLists() {
        const filterText = this.nameFilter;
        return !filterText
            ? this.lists
            : this.lists.filter(x =>
                x.title.toLowerCase()
                    .includes(filterText));
    },

    setLists(lists) {
        this.lists = lists;
        Ui.renderLists(this.filteredLists, this.pages);
    },
    setPages(curPage, numOfPages, lists)
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
        data.setLists(lists);
    },
    addList(list) { 
        this.lists.push(list); 
        Ui.renderLists(this.filteredLists, this.pages);
    },
    removeList(listId) { 
        this.lists = this.lists.filter(x => x.id !== listId); 
        Ui.renderLists(this.filteredLists, this.pages);
    },
};

window.addEventListener('load', async (le) => {
    await Ui.loadListTemplate();
    await Ui.loadPaginationTemplate();
    fetch(`/api/v1/lists`)
        .then(json => json.text())
        .then(json =>
        {
            json = JSON.parse(json);
            data.setPages(json.curPage, json.pages, json.lists);
        });
});


function myPag(page)
{
    fetch(`/api/v1/lists?page=${page}`)
    .then(json => json.text())
    .then(json =>
    {
        json = JSON.parse(json);
        data.setPages(json.curPage, json.pages, json.lists);
    });
}

Ui.filterListsInputEl.addEventListener('input', (e) => { data.nameFilter = e.target.value; });
Ui.clearListsFilterEl.addEventListener('click', (e) => { data.nameFilter = '';});


