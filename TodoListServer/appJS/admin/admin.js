"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
function initAdmin(app, config) {
    app.get("/admin", (req, res) => {
        let fileName;
        if (config.isconnected()) {
            fileName = "connected.html";
        }
        else {
            fileName = "disconnected.html";
        }
        res.sendFile(path.join(config.rootPath, `./app/admin/${fileName}`));
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
exports.initAdmin = initAdmin;
