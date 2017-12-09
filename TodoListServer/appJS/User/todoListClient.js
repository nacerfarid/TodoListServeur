"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Client {
    constructor() {
        this.mapping = new Map();
        this.invertMapping = new Map();
    }
    getId(ListID) {
        if (this.mapping.has(ListID)) {
            return this.mapping.get(ListID);
        }
        else {
            return ListID;
        }
    }
    getUser() {
        return this.user;
    }
    setUser(user) {
        this.user = user;
        return this;
    }
    unregisterAllMappings() {
        this.mapping.clear();
        this.invertMapping.clear();
    }
    registerMapping(clientId, serverId) {
        this.mapping.set(clientId, serverId);
        this.invertMapping.set(serverId, clientId);
        return this;
    }
    unregisterMapping(clientId, serverId) {
        if (this.mapping.has(clientId)) {
            if (this.mapping.get(clientId) === serverId) {
                this.mapping.delete(clientId);
                this.invertMapping.delete(serverId);
            }
            else {
                throw "CLIENT ID WAS NOT MAPPED WITH THIS SERVER ID";
            }
        }
        else {
            throw "UNKNOWN CLIENT ID";
        }
        return this;
    }
}
exports.Client = Client;
