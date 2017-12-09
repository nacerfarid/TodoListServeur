"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const todoListTypes_1 = require("@data/todoListTypes");
const immutable_1 = require("immutable");
function* generatorID_stringPrefix(prefix) {
    let i = 0;
    while (true) {
        yield `${prefix}::${++i}`;
    }
}
let idListGen = generatorID_stringPrefix("List");
let idItemGen = generatorID_stringPrefix("Item");
function getNextIdList() {
    return idListGen.next().value;
}
function getNextIdItem() {
    return idItemGen.next().value;
}
function getOrCreateUser(passport) {
    let user = getUserById(passport.id);
    return user ? user : new User(passport);
}
exports.getOrCreateUser = getOrCreateUser;
function getUserById(id) {
    return users.get(id);
}
exports.getUserById = getUserById;
function disconnectClients() {
    users.forEach(U => U.removeAllClients());
}
exports.disconnectClients = disconnectClients;
let users = new Map();
class User {
    constructor(passport) {
        this.passport = passport;
        this.clock = 0;
        this.history = [];
        this.historyMaxLength = 20;
        this.todoLists = immutable_1.List();
        this.items = immutable_1.List();
        this.clients = [];
        users.set(passport.id, this);
    }
    dispose() {
        this.clients.forEach(C => C.close());
        users.delete(this.passport.id);
    }
    toJSON() {
        return {
            passport: this.passport,
            todoLists: this.todoLists.map(tdl => tdl.toJSON()).toArray()
        };
    }
    appendClient(...clients) {
        clients.forEach(client => {
            client.setUser(this);
            this.sendStateToClients(client);
        });
        this.clients.push(...clients);
        console.log("appendClient => #clients =", this.clients.length);
    }
    removeAllClients() {
        this.removeClient(...this.clients);
    }
    removeClient(...clients) {
        const toBeRemoved = (c) => clients.indexOf(c) >= 0;
        this.clients.filter(toBeRemoved).forEach(client => {
            client.setUser(null);
        });
        this.clients = this.clients.filter(c => !toBeRemoved(c));
        console.log("removeClient => #clients =", this.clients.length);
    }
    sendToClients(clients, ...messages) {
        clients = clients || this.clients;
        clients.forEach(c => c.send(...messages));
        return this;
    }
    apply(client, msg) {
        switch (msg.type) {
            case "TODOLISTS_NEW_STATE":
                return this.TODOLISTS_NEW_STATE(client, msg);
            case "SERVER_CREATE_NEW_LIST":
                return this.SERVER_CREATE_NEW_LIST(client, msg);
            case "SERVER_DELETE_LIST":
                return this.SERVER_DELETE_LIST(client, msg);
            case "SERVER_UPDATE_LIST_NAME":
                return this.SERVER_UPDATE_LIST_NAME(client, msg);
            case "SERVER_UPDATE_LIST_DATA":
                return this.SERVER_UPDATE_LIST_DATA(client, msg);
            case "SERVER_CREATE_ITEM":
                return this.SERVER_CREATE_ITEM(client, msg);
            case "SERVER_DELETE_ITEM":
                return this.SERVER_DELETE_ITEM(client, msg);
            case "SERVER_UPDATE_ITEM_CHECK":
                return this.SERVER_UPDATE_ITEM_CHECK(client, msg);
            case "SERVER_UPDATE_ITEM_LABEL":
                return this.SERVER_UPDATE_ITEM_LABEL(client, msg);
            case "SERVER_UPDATE_ITEM_DATA":
                return this.SERVER_UPDATE_ITEM_DATA(client, msg);
            default:
                console.error("UNKNOWN SERVER MESSAGE RECEIVED:\n", msg);
                throw "UNKNOWN SERVER MESSAGE RECEIVED";
        }
    }
    saveState() {
        this.history.push({
            clockValue: ++this.clock,
            todoLists: this.todoLists
        });
        if (this.history.length >= this.historyMaxLength) {
            this.history.shift();
        }
        return this;
    }
    getList(id) {
        const tdl = this.todoLists.find(L => L.hasId(id));
        if (tdl) {
            return tdl;
        }
        else {
            throw "NO LIST IDENTIFIED BY THIS ID";
        }
    }
    sendStateToClients(...clients) {
        clients = clients.length ? clients : this.clients;
        const msg = {
            type: "TODOLISTS_NEW_STATE",
            items: this.items.map(I => I.toJSON()).toArray(),
            lists: this.todoLists.map(L => L.toJSON()).toArray()
        };
        //clients.forEach( c => c.unregisterAllMappings() );
        this.sendToClients(clients, msg);
        return this;
    }
    updateTodoList(L, nextTdl) {
        const tdl = typeof L === "string" ? this.getList(L) : L;
        this.saveState();
        this.items = immutable_1.List(this.items.filterNot(item => tdl.contains(item))); // Remove items from tdl
        if (nextTdl) {
            this.todoLists = immutable_1.List(this.todoLists.map(L => L === tdl ? nextTdl : L));
            this.items = this.items.push(...nextTdl.getItems().toArray()); // Add items from newTdl
        }
        else {
            this.todoLists = immutable_1.List(this.todoLists.filterNot(L => L === tdl));
        }
    }
    SERVER_CREATE_NEW_LIST(client, msg) {
        this.saveState();
        const tdl = new todoListTypes_1.TodoList(msg.name, immutable_1.List(), getNextIdList(), 0, {});
        this.todoLists = this.todoLists.push(tdl);
        client.registerMapping(msg.clientListId, tdl.getId());
        this.sendStateToClients();
    }
    SERVER_UPDATE_LIST_DATA(client, msg) {
        const tdl = this.getList(client.getId(msg.ListID));
        if (tdl) {
            this.saveState();
            this.updateTodoList(tdl.getId(), tdl.setData(msg.data));
            this.sendStateToClients();
        }
    }
    TODOLISTS_NEW_STATE(client, msg) {
        const items = msg.items.map((itemJSON) => {
            const serverItemId = client.getId(itemJSON.id);
            const item = this.items.find(item => item.hasId(serverItemId));
            if (item) {
                return item.setStateFromJSON(itemJSON);
            }
            else {
                const newItem = new todoListTypes_1.Item(itemJSON.label, itemJSON.checked, Date.now(), getNextIdItem(), 0, itemJSON.data);
                client.registerMapping(itemJSON.id, newItem.getId());
                return newItem;
            }
        });
        const lists = msg.lists.map(listJSON => {
            const clientListId = client.getId(listJSON.id);
            const list = this.todoLists.find(L => L.hasId(clientListId));
            console.log(listJSON.id, "items:", listJSON.items);
            const itemsList = listJSON.items.map(id => client.getId(id)).map(idItem => items.find(item => item.hasId(idItem))).filter(I => I !== undefined);
            if (list) {
                return list.update(listJSON.name, itemsList);
            }
            else {
                const newList = new todoListTypes_1.TodoList(listJSON.name, immutable_1.List(itemsList), getNextIdList(), 0, listJSON.data);
                // client.registerMapping(listJSON.id, newList.getId());
                return newList;
            }
        });
        this.saveState();
        console.log("Lists:\n", lists, "\nItems:\n", items);
        this.todoLists = immutable_1.List(lists);
        this.items = immutable_1.List(items);
        this.sendStateToClients();
    }
    SERVER_DELETE_LIST(client, msg) {
        const ListID = client.getId(msg.ListID);
        this.updateTodoList(ListID, undefined);
        this.sendStateToClients();
    }
    SERVER_UPDATE_LIST_NAME(client, msg) {
        const tdl = this.getList(client.getId(msg.ListID));
        const newTdl = tdl.setName(msg.name);
        this.updateTodoList(tdl, newTdl);
        this.sendStateToClients();
    }
    SERVER_CREATE_ITEM(client, msg) {
        const ListID = client.getId(msg.ListID);
        const tdl = this.getList(ListID);
        const item = new todoListTypes_1.Item(msg.label, false, Date.now(), getNextIdItem(), 0, { tag: msg.tag, color: msg.color });
        const newTdl = tdl.push(item);
        client.registerMapping(msg.clientItemId, item.getId());
        this.updateTodoList(tdl, newTdl);
        this.sendStateToClients();
    }
    SERVER_UPDATE_ITEM_DATA(client, msg) {
        const ListID = client.getId(msg.ListID);
        const ItemID = client.getId(msg.ItemID);
        const tdl = this.getList(ListID);
        if (tdl && tdl.contains(ItemID)) {
            this.saveState();
            this.updateTodoList(tdl.getId(), tdl.setItemData(ItemID, msg.data));
            this.sendStateToClients();
        }
    }
    SERVER_DELETE_ITEM(client, msg) {
        const ListID = client.getId(msg.ListID);
        const ItemID = client.getId(msg.ItemID);
        const tdl = this.getList(ListID);
        if (tdl.findItem(item => item.hasId(ItemID))) {
            const newTdl = tdl.delete(ItemID);
            this.updateTodoList(tdl, newTdl);
            this.sendStateToClients();
        }
    }
    SERVER_UPDATE_ITEM_CHECK(client, msg) {
        const ListID = client.getId(msg.ListID);
        const ItemID = client.getId(msg.ItemID);
        const tdl = this.getList(ListID);
        if (tdl.findItem(item => item.hasId(ItemID))) {
            const newTdl = tdl.setItemChecked(ItemID, msg.check);
            this.updateTodoList(tdl, newTdl);
            this.sendStateToClients();
        }
    }
    SERVER_UPDATE_ITEM_LABEL(client, msg) {
        const ListID = client.getId(msg.ListID);
        const ItemID = client.getId(msg.ItemID);
        const tdl = this.getList(ListID);
        if (tdl.findItem(item => item.hasId(ItemID))) {
            const newTdl = tdl.setItemLabel(ItemID, msg.label);
            this.updateTodoList(tdl, newTdl);
            this.sendStateToClients();
        }
    }
}
exports.User = User;
