import {Client} from "./todoListClient";
import {MESSAGE_FOR_CLIENT, MESSAGE_FOR_SERVER} from "@data/protocol";
import {User} from "@User/User";

export class TodoListClientSocketIO extends Client {
    constructor(private socket: SocketIO.Socket) {
        super();
        socket.on("disconnect", () => {
            const user = this.getUser();
            if (user) {
                user.removeClient(this);
            }
        });
        socket.on("operations", (ops: MESSAGE_FOR_SERVER[]) => {
            const user = this.getUser();
            ops.forEach(op => user.apply(this, op) );
        });
        socket.on("operation", (op: MESSAGE_FOR_SERVER) => {
            // console.log("operation", op);
            this.getUser().apply(this, op);
        });
    }

    close(): void {
        this.socket.disconnect();
    }

    setUser(user: User): this {
        super.setUser(user);
        if (!user) {
            this.close();
        }
        return this;
    }

    send(...messages: MESSAGE_FOR_CLIENT[]): this {
        messages.forEach( msg => this.socket.emit("MESSAGE_FOR_CLIENT", msg) );
        return this;
    }
}
