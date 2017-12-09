import {
    ListID, MESSAGE_FOR_CLIENT, MESSAGE_FOR_SERVER,
    SERVER_CREATE_NEW_LIST, SERVER_DELETE_LIST, SERVER_UPDATE_LIST_NAME, SERVER_CREATE_ITEM,
    SERVER_DELETE_ITEM, SERVER_UPDATE_ITEM_CHECK, SERVER_UPDATE_ITEM_LABEL, ItemID,
    PassportUser, TODOLISTS_NEW_STATE, ItemJSON, SERVER_UPDATE_LIST_DATA, SERVER_UPDATE_ITEM_DATA
} from "@data/protocol";
import {Item, TodoList} from "@data/todoListTypes";
import {List} from "immutable";
import {Client} from "./todoListClient";

function* generatorID_stringPrefix(prefix: string): Iterator<string> {
    let i = 0;
    while (true) {
        yield `${prefix}::${++i}`;
    }
}
let idListGen: Iterator<ListID> = generatorID_stringPrefix("List");
let idItemGen: Iterator<ListID> = generatorID_stringPrefix("Item");
function getNextIdList(): ListID {
    return idListGen.next().value;
}
function getNextIdItem(): ListID {
    return idItemGen.next().value;
}

export function getOrCreateUser(passport: PassportUser): User {
    let user = getUserById(passport.id);
    return user ? user : new User(passport);
}

export function getUserById(id: string): User {
    return users.get(id);
}

export function disconnectClients() {
    users.forEach( U => U.removeAllClients() );
}

let users = new Map<string, User>();
export class User {
    private clock = 0;
    private history: {clockValue: number, todoLists: List<TodoList>}[] = [];
    historyMaxLength = 20;
    private todoLists = List<TodoList>();
    private items = List<Item>();
    private clients: Client[] = [];
    constructor(private passport: PassportUser) {
        users.set(passport.id, this);
    }
    dispose() {
        this.clients.forEach( C => C.close() );
        users.delete(this.passport.id);
    }
    toJSON() {
        return {
            passport: this.passport,
            todoLists: this.todoLists.map(tdl => tdl.toJSON()).toArray()
        };
    }
    appendClient(...clients: Client[]) {
        clients.forEach( client => {
            client.setUser(this);
            this.sendStateToClients(client);
        });
        this.clients.push( ...clients );
        console.log("appendClient => #clients =", this.clients.length);
    }
    removeAllClients() {
        this.removeClient(...this.clients);
    }
    removeClient(...clients: Client[]) {
        const toBeRemoved = (c: Client) => clients.indexOf(c) >= 0;
        this.clients.filter( toBeRemoved ).forEach( client => {
            client.setUser(null);
        });
        this.clients = this.clients.filter( c => !toBeRemoved(c) );
        console.log("removeClient => #clients =", this.clients.length);
    }
    sendToClients(clients: Client[], ...messages: MESSAGE_FOR_CLIENT[]): this {
        clients = clients || this.clients;
        clients.forEach( c => c.send(...messages) );
        return this;
    }
    apply(client: Client, msg: MESSAGE_FOR_SERVER) {
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

    private saveState(): this {
        this.history.push( {
            clockValue: ++this.clock,
            todoLists: this.todoLists
        } );
        if (this.history.length >= this.historyMaxLength) {
            this.history.shift();
        }
        return this;
    }
    private getList(id: ListID): TodoList {
        const tdl: TodoList = this.todoLists.find( L => L.hasId(id) );
        if (tdl) {
            return tdl;
        } else {
            throw "NO LIST IDENTIFIED BY THIS ID";
        }
    }

    private sendStateToClients(...clients: Client[]): this {
        clients = clients.length ? clients : this.clients;
        const msg: TODOLISTS_NEW_STATE = {
            type: "TODOLISTS_NEW_STATE",
            items: this.items.map( I => I.toJSON() ).toArray(),
            lists: this.todoLists.map( L => L.toJSON() ).toArray()
        };
        //clients.forEach( c => c.unregisterAllMappings() );
        this.sendToClients(clients, msg);
        return this;
    }
    private updateTodoList(L: ListID | TodoList, nextTdl: TodoList) {
        const tdl: TodoList = typeof L === "string" ? this.getList(L) : L;
        this.saveState();
        this.items = List(this.items.filterNot(item => tdl.contains(item) )); // Remove items from tdl
        if (nextTdl) {
            this.todoLists = List(this.todoLists.map(L => L === tdl ? nextTdl : L) );
            this.items = this.items.push( ...nextTdl.getItems().toArray() ); // Add items from newTdl
        } else {
            this.todoLists = List(this.todoLists.filterNot(L => L === tdl) );
        }
    }
    private SERVER_CREATE_NEW_LIST(client: Client, msg: SERVER_CREATE_NEW_LIST) {
        this.saveState();
        const tdl = new TodoList(msg.name, List<Item>(), getNextIdList(), 0, {});
        this.todoLists = this.todoLists.push( tdl );
        client.registerMapping(msg.clientListId, tdl.getId());
        this.sendStateToClients();
    }

    private SERVER_UPDATE_LIST_DATA(client: Client, msg: SERVER_UPDATE_LIST_DATA) {
        const tdl: TodoList = this.getList( client.getId(msg.ListID) );
        if (tdl) {
            this.saveState();
            this.updateTodoList(tdl.getId(), tdl.setData(msg.data));
            this.sendStateToClients();
        }
    }

    private TODOLISTS_NEW_STATE(client: Client, msg: TODOLISTS_NEW_STATE) {
        const items: Item[] = msg.items.map( (itemJSON: ItemJSON) => {
            const serverItemId = client.getId(itemJSON.id);
            const item = this.items.find( item => item.hasId(serverItemId) );
            if (item) { // Update item
                return item.setStateFromJSON( itemJSON );
            } else { // Create new one
                const newItem = new Item(itemJSON.label, itemJSON.checked, Date.now(), getNextIdItem(), 0, itemJSON.data);
                client.registerMapping(itemJSON.id, newItem.getId());
                return newItem;
            }
        });
        const lists: TodoList[] = msg.lists.map( listJSON => {
            const clientListId = client.getId(listJSON.id);
            const list = this.todoLists.find( L => L.hasId(clientListId) );
            console.log(listJSON.id, "items:", listJSON.items);
            const itemsList = listJSON.items.map(id => client.getId(id)).map(
                idItem => items.find(item => item.hasId(idItem))
            ).filter(I => I !== undefined);
            if (list) { // Update existing list
                return list.update(listJSON.name, itemsList);
            } else { //
                const newList = new TodoList(listJSON.name, List(itemsList), getNextIdList(), 0, listJSON.data);
                // client.registerMapping(listJSON.id, newList.getId());
                return newList;
            }
        });
        this.saveState();
        console.log("Lists:\n", lists, "\nItems:\n", items);
        this.todoLists = List(lists);
        this.items = List(items);
        this.sendStateToClients();
    }

    private SERVER_DELETE_LIST(client: Client, msg: SERVER_DELETE_LIST) {
        const ListID: ListID = client.getId(msg.ListID);
        this.updateTodoList(ListID, undefined);
        this.sendStateToClients();
    }

    private SERVER_UPDATE_LIST_NAME(client: Client, msg: SERVER_UPDATE_LIST_NAME) {
        const tdl: TodoList = this.getList( client.getId(msg.ListID) );

        const newTdl = tdl.setName( msg.name );
        this.updateTodoList(tdl, newTdl);
        this.sendStateToClients();
    }

    private SERVER_CREATE_ITEM(client: Client, msg: SERVER_CREATE_ITEM) {
        const ListID: ListID = client.getId(msg.ListID);
        const tdl: TodoList = this.getList(ListID);
        const item = new Item(msg.label, false, Date.now(), getNextIdItem(), 0, { tag : msg.tag, color : msg.color});
        const newTdl = tdl.push( item );
        client.registerMapping(msg.clientItemId, item.getId());
        this.updateTodoList(tdl, newTdl);
        this.sendStateToClients();
    }

    private SERVER_UPDATE_ITEM_DATA(client: Client, msg: SERVER_UPDATE_ITEM_DATA) {
        const ListID: ListID = client.getId(msg.ListID);
        const ItemID: ItemID = client.getId(msg.ItemID);
        const tdl: TodoList = this.getList(ListID);
        if (tdl && tdl.contains(ItemID)) {
            this.saveState();
            this.updateTodoList(tdl.getId(), tdl.setItemData(ItemID, msg.data));
            this.sendStateToClients();
        }
    }

    private SERVER_DELETE_ITEM(client: Client, msg: SERVER_DELETE_ITEM) {
        const ListID: ListID = client.getId(msg.ListID);
        const ItemID: ItemID = client.getId(msg.ItemID);
        const tdl: TodoList = this.getList(ListID);
        if (tdl.findItem(item => item.hasId(ItemID))) {
            const newTdl = tdl.delete( ItemID );
            this.updateTodoList(tdl, newTdl);
            this.sendStateToClients();
        }
    }

    private SERVER_UPDATE_ITEM_CHECK(client: Client, msg: SERVER_UPDATE_ITEM_CHECK) {
        const ListID: ListID = client.getId(msg.ListID);
        const ItemID: ItemID = client.getId(msg.ItemID);
        const tdl: TodoList = this.getList(ListID);
        if (tdl.findItem(item => item.hasId(ItemID))) {
            const newTdl = tdl.setItemChecked(ItemID, msg.check);
            this.updateTodoList(tdl, newTdl);
            this.sendStateToClients();
        }
    }

    private SERVER_UPDATE_ITEM_LABEL(client: Client, msg: SERVER_UPDATE_ITEM_LABEL) {
        const ListID: ListID = client.getId(msg.ListID);
        const ItemID: ItemID = client.getId(msg.ItemID);
        const tdl: TodoList = this.getList(ListID);
        if (tdl.findItem(item => item.hasId(ItemID))) {
            const newTdl = tdl.setItemLabel(ItemID, msg.label);
            this.updateTodoList(tdl, newTdl);
            this.sendStateToClients();
        }
    }
}
