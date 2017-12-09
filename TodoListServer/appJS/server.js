"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register"); // Used to take into account path declaration for modules
// See declarations in package.json
const http = require("http"); // HTTP server
const https = require("https"); // HTTPS server
const express = require("express"); // The application server
const bodyParser = require("body-parser"); // Parse HTTP GET and POST variables
const path = require("path"); // Deal with system paths
const socketIO = require("socket.io"); // Websocket server
const passport = require("passport"); // Connection manager
const cookieParser = require("cookie-parser"); // Cookie parser
const flash = require("connect-flash"); //
const session = require("express-session"); // Session manager
const fs = require("fs-extra"); // Acces to files
const User_1 = require("@User/User");
const todoListClientSocketIO_1 = require("@User/todoListClientSocketIO");
const OAuth_1 = require("@OAuth/OAuth");
const admin_1 = require("./admin/admin");
const app = express();
// HTTP
const serverHTTP = http.createServer(app);
const portHTTP = process.env.PORT || 8080;
serverHTTP.listen(portHTTP, () => {
    console.log(`HTTP server running on port ${portHTTP}`);
});
// HTTPS
const portHTTPS = 8443;
const TLS_SSL = {
    key: fs.readFileSync(path.join("./app/MM.pem")),
    cert: fs.readFileSync(path.join("./app/certificat.pem"))
};
const serverHTTPS = https.createServer(TLS_SSL, app).listen(portHTTPS, () => {
    console.log(`HTTPS server running on port ${portHTTPS}`);
});
// COnfigure the web server
let sessionMiddleware = session({
    secret: "thisIsAVerySecretMessage",
    resave: true,
    saveUninitialized: true
});
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
app.use(sessionMiddleware); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session
OAuth_1.RegisterOAuth(app); // OAuth2
// Fonction to check identification and redirect to login page of not identhified
const IdentifiedOrLogin = OAuth_1.checkIsAuthentified(401, "/login.html");
// Static files
const angularClientPath = path.join(__dirname, "../TodoListClientAngular2/dist");
app.get("/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "../app/login.html"));
});
app.use(IdentifiedOrLogin, express.static(angularClientPath));
// Setup Socket.io server
// const io = socketIO(server);
function configureSocketIO(io) {
    io.use(function (socket, next) {
        sessionMiddleware(socket.request, {}, next);
    }).on("connection", socket => {
        let passportJSON = socket.request.session.passport;
        if (connectionsEnabled && passportJSON && passportJSON.user) {
            console.log("passportJSON:", passportJSON);
            const user = User_1.getUserById(passportJSON.user);
            socket.emit("user", user.toJSON());
            user.appendClient(new todoListClientSocketIO_1.TodoListClientSocketIO(socket));
        }
        else {
            if (connectionsEnabled) {
                console.log("Closing socket.io connection: no passport information.");
            }
            else {
                console.log("Closing connection to simulate offline mode");
            }
            socket.disconnect();
        }
    });
}
const ioHTTP = socketIO(serverHTTP);
const ioHTTPS = socketIO(serverHTTPS);
configureSocketIO(ioHTTP);
configureSocketIO(ioHTTPS);
// Admin part for testing
let connectionsEnabled = true;
admin_1.initAdmin(app, {
    rootPath: path.join(__dirname, ".."),
    isconnected: () => connectionsEnabled,
    disconnect: () => {
        connectionsEnabled = false;
        User_1.disconnectClients();
    },
    reconnect: () => {
        connectionsEnabled = true;
    }
});
