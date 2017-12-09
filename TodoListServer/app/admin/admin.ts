import {Application} from "express";
import * as path from "path";

export function initAdmin(app: Application, config: {isconnected: () => boolean, disconnect: Function, reconnect: Function, rootPath: string}) {
    app.get("/admin", (req, res) => {
        let fileName: string;
        if (config.isconnected()) {
            fileName = "connected.html";
        } else {
            fileName = "disconnected.html";
        }
        res.sendFile( path.join(config.rootPath, `./app/admin/${fileName}`) );
    });
    app.get("/admin/simulateDeconnection", (req, res) => {
        config.disconnect();
        res.redirect("/admin");
    });
    app.get("/admin/simulateReconnection", (req, res) => {
        config.reconnect();
        res.redirect("/admin");
    });
}
