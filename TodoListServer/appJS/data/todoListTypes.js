"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = require("immutable");
class Item {
    constructor(label, checked, date, id, clock, data) {
        this.label = label;
        this.checked = checked;
        this.date = date;
        this.id = id;
        this.clock = clock;
        this.data = data;
        this.date = this.date || Date.now();
    }
    hasId(id) {
        return this.id === id;
    }
    getId() {
        return this.id;
    }
    getLabel() {
        return this.label;
    }
    getChecked() {
        return this.checked;
    }
    getDate() {
        return this.date;
    }
    getData() {
        return this.data;
    }
    setLabel(str) {
        return new Item(str, this.getChecked(), this.getDate(), this.id, ++this.clock, this.getData());
    }
    setChecked(checked) {
        return new Item(this.getLabel(), checked, this.getDate(), this.id, ++this.clock, this.getData());
    }
    setData(data) {
        return new Item(this.getLabel(), this.getChecked(), this.getDate(), this.id, ++this.clock, data);
    }
    setStateFromJSON(json) {
        return new Item(json.label, json.checked, json.date, json.id, ++this.clock, json.data);
    }
    toJSON() {
        this.lastJSON = this.lastJSON || {
            label: this.label,
            checked: this.checked,
            date: this.date,
            id: this.id,
            clock: this.clock,
            data: this.data
        };
        return this.lastJSON;
    }
}
exports.Item = Item;
class TodoList {
    constructor(name, items, id, clock, data) {
        this.name = name;
        this.items = items;
        this.id = id;
        this.clock = clock;
        this.data = data;
        items = items || immutable_1.List();
    }
    hasId(id) {
        return this.id === id;
    }
    getId() {
        return this.id;
    }
    getName() {
        return this.name;
    }
    contains(item) {
        if (item instanceof Item) {
            return this.items.contains(item);
        }
        else {
            const ItemID = item;
            return this.items.find(I => I.hasId(ItemID)) !== undefined;
        }
    }
    getItems() {
        return this.items;
    }
    getData() {
        return this.data;
    }
    findItem(fct) {
        return this.items.find(fct);
    }
    getItemLabel(idItem) {
        const item = this.items.find(item => item.hasId(idItem));
        if (item) {
            return item.getLabel();
        }
        else {
            throw "NO ITEM IDENTIFIED BY THIS ID IN THIS LIST";
        }
    }
    getItemCheck(idItem) {
        const item = this.items.find(item => item.hasId(idItem));
        if (item) {
            return item.getChecked();
        }
        else {
            throw "NO ITEM IDENTIFIED BY THIS ID IN THIS LIST";
        }
    }
    setName(name) {
        return new TodoList(name, this.getItems(), this.id, ++this.clock, this.getData());
    }
    setData(data) {
        return new TodoList(this.getName(), this.getItems(), this.id, ++this.clock, data);
    }
    push(item) {
        return new TodoList(this.getName(), this.getItems().push((item)), this.id, ++this.clock, this.getData());
    }
    delete(ItemID) {
        const items = this.getItems().filterNot(item => item.hasId(ItemID));
        return new TodoList(this.getName(), immutable_1.List(items), this.id, ++this.clock, this.getData());
    }
    setItemData(idItem, data) {
        const item = this.items.find(item => item.hasId(idItem));
        if (item) {
            const newItem = item.setData(data);
            return new TodoList(this.getName(), immutable_1.List(this.items.map(item => item.hasId(idItem) ? newItem : item)), this.id, ++this.clock, this.getData());
        }
        else {
            return this;
        }
    }
    setItemLabel(idItem, label) {
        const item = this.items.find(item => item.hasId(idItem));
        if (item) {
            const newItem = item.setLabel(label);
            return new TodoList(this.getName(), immutable_1.List(this.items.map(item => item.hasId(idItem) ? newItem : item)), this.id, ++this.clock, this.getData());
        }
        else {
            return this;
        }
    }
    setItemChecked(idItem, checked) {
        const item = this.items.find(item => item.hasId(idItem));
        if (item) {
            const newItem = item.setChecked(checked);
            return new TodoList(this.getName(), immutable_1.List(this.items.map(item => item.hasId(idItem) ? newItem : item)), this.id, ++this.clock, this.getData());
        }
        else {
            return this;
        }
    }
    update(name, items) {
        return new TodoList(name, immutable_1.List(items), this.id, ++this.clock, this.getData());
    }
    toJSON() {
        this.lastJSON = this.lastJSON || {
            name: this.name,
            items: this.items.map(item => item.getId()).toArray(),
            id: this.id,
            clock: this.clock,
            data: this.getData()
        };
        return this.lastJSON;
    }
}
exports.TodoList = TodoList;
