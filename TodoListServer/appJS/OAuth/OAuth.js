"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const OAuthFacebook_1 = require("./OAuthFacebook");
const OAuthGoogle_1 = require("./OAuthGoogle");
const passport = require("passport");
function RegisterOAuth(app, urlPrefix = "") {
    app.use(OAuthGoogle_1.initOAuthGoogle({
        GOOGLE_CLIENT_ID: "150032486069-n9lbjqif9ucmu84bmc00jcm70hfiat0u.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "u64PkUyI8cdYufa3Fsi8Id_q",
        urlPrefix: urlPrefix
    }));
    app.use(OAuthFacebook_1.initOAuthFacebook({
        FACEBOOK_APP_ID: "1109157522518747",
        FACEBOOK_APP_SECRET: "4eef17abc775beb2932bdf01ccd545e5",
        urlPrefix: urlPrefix
    }));
    passport.serializeUser((user, done) => {
        registerUser(user);
        done(null, user.id);
    });
    passport.deserializeUser((id, done) => {
        const user = getUserFromId(id);
        done(null, user ? user : false);
    });
}
exports.RegisterOAuth = RegisterOAuth;
let passportUsers = new Map();
function getUserFromId(id) {
    return passportUsers.get(id);
}
exports.getUserFromId = getUserFromId;
function registerUser(user) {
    return passportUsers.set(user.id, user);
}
exports.registerUser = registerUser;
// Check if client is authentified
function checkIsAuthentified(statusIfFailed, ressourceIfFailed) {
    return (req, res, next) => {
        if (req.isAuthenticated()) {
            next();
        }
        else {
            res.status(statusIfFailed);
            if (typeof ressourceIfFailed === "string") {
                res.redirect(ressourceIfFailed);
            }
            else {
                res.json({ error: "YOU ARE NOT LOGGED IN" });
            }
        }
    };
}
exports.checkIsAuthentified = checkIsAuthentified;
