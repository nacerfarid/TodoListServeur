require("module-alias/register"); // Used to take into account path declaration for modules
                                 // See declarations in package.json

import * as http from "http";                   // HTTP server
import * as https from "https";                 // HTTPS server
import * as express from "express";             // The application server
import * as bodyParser from "body-parser";      // Parse HTTP GET and POST variables
import * as path from "path";                   // Deal with system paths
import * as socketIO from "socket.io";          // Websocket server
import * as passport from "passport";           // Connection manager
import * as cookieParser from "cookie-parser";  // Cookie parser
import * as flash from "connect-flash";         //
import * as session from "express-session";     // Session manager
import * as fs from "fs-extra";                 // Acces to files

import {disconnectClients, getUserById} from "@User/User";
import {TodoListClientSocketIO} from "@User/todoListClientSocketIO";
import {RegisterOAuth, checkIsAuthentified} from "@OAuth/OAuth";

import {initAdmin} from "./admin/admin";

const app: express.Application = express();

// HTTP
const serverHTTP = http.createServer(app);
const portHTTP = process.env.PORT || 8080;
serverHTTP.listen(portHTTP, () => {
    console.log(`HTTP server running on port ${portHTTP}`);
});

// HTTPS
const portHTTPS = 8443;
const TLS_SSL =	{
    key : fs.readFileSync( path.join("./app/MM.pem"		 ) ),
    cert: fs.readFileSync( path.join("./app/certificat.pem") )
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
app.use(bodyParser.urlencoded({extended: true}));

app.use(sessionMiddleware); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

RegisterOAuth(app); // OAuth2

// Fonction to check identification and redirect to login page of not identhified
const IdentifiedOrLogin = checkIsAuthentified(401, "/login.html");

// Static files
const angularClientPath = path.join(__dirname, "../TodoListClientAngular2/dist");
app.get("/login.html", (req, res) => {
    res.sendFile( path.join(__dirname, "../app/login.html") );
});
app.use(IdentifiedOrLogin, express.static( angularClientPath ));

// Setup Socket.io server
// const io = socketIO(server);
function configureSocketIO(io: SocketIO.Server) {
    io.use(function (socket, next) {
        sessionMiddleware(socket.request, {}, next);
    }).on("connection", socket => {
        let passportJSON = socket.request.session.passport;
        if (connectionsEnabled && passportJSON && passportJSON.user) {
            console.log("passportJSON:", passportJSON);
            const user = getUserById(passportJSON.user);
            socket.emit("user", user.toJSON());
            user.appendClient(new TodoListClientSocketIO(socket));
        } else {
            if (connectionsEnabled) {
                console.log("Closing socket.io connection: no passport information.");
            } else {
                console.log("Closing connection to simulate offline mode");
            }
            socket.disconnect();
        }
    });
}
const ioHTTP  = socketIO(serverHTTP );
const ioHTTPS = socketIO(serverHTTPS);
configureSocketIO(ioHTTP );
configureSocketIO(ioHTTPS);

// Admin part for testing
let connectionsEnabled = true;
initAdmin(app, {
    rootPath: path.join(__dirname, ".."),
    isconnected: () => connectionsEnabled,
    disconnect: () => {
        connectionsEnabled = false;
        disconnectClients();
    },
    reconnect: () => {
        connectionsEnabled = true;
    }
});
