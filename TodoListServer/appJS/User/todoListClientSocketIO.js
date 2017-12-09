"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const todoListClient_1 = require("./todoListClient");
class TodoListClientSocketIO extends todoListClient_1.Client {
    constructor(socket) {
        super();
        this.socket = socket;
        socket.on("disconnect", () => {
            const user = this.getUser();
            if (user) {
                user.removeClient(this);
            }
        });
        socket.on("operations", (ops) => {
            const user = this.getUser();
            ops.forEach(op => user.apply(this, op));
        });
        socket.on("operation", (op) => {
            // console.log("operation", op);
            this.getUser().apply(this, op);
        });
    }
    close() {
        this.socket.disconnect();
    }
    setUser(user) {
        super.setUser(user);
        if (!user) {
            this.close();
        }
        return this;
    }
    send(...messages) {
        messages.forEach(msg => this.socket.emit("MESSAGE_FOR_CLIENT", msg));
        return this;
    }
}
exports.TodoListClientSocketIO = TodoListClientSocketIO;
