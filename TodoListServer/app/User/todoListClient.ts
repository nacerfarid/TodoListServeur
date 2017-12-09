import {ListID, MESSAGE_FOR_CLIENT} from "@data/protocol";
import {User} from "./User";

export abstract class Client {
    private mapping = new Map<string, string>();
    private invertMapping = new Map<string, string>();
    private user: User;
    constructor() {}
    abstract send(...messages: MESSAGE_FOR_CLIENT[]): this;
    abstract close(): void;
    getId(ListID: ListID): ListID {
        if (this.mapping.has(ListID)) {
            return this.mapping.get(ListID);
        } else {
            return ListID;
        }
    }
    getUser(): User {
        return this.user;
    }
    setUser(user: User): this {
        this.user = user;
        return this;
    }
    unregisterAllMappings() {
        this.mapping.clear();
        this.invertMapping.clear();
    }
    registerMapping(clientId: string, serverId: string): this {
        this.mapping.set(clientId, serverId);
        this.invertMapping.set(serverId, clientId);
        return this;
    }
    unregisterMapping(clientId: string, serverId: string): this {
        if (this.mapping.has(clientId)) {
            if (this.mapping.get(clientId) === serverId) {
                this.mapping.delete(clientId);
                this.invertMapping.delete(serverId);
            } else {
                throw "CLIENT ID WAS NOT MAPPED WITH THIS SERVER ID";
            }
        } else {
            throw "UNKNOWN CLIENT ID";
        }
        return this;
    }
}
