import {initOAuthFacebook} from "./OAuthFacebook";
import {initOAuthGoogle} from "./OAuthGoogle";
import {Application} from "express";
import {PassportUser} from "@data/protocol";
import * as passport from "passport";

export function RegisterOAuth(app: Application, urlPrefix: string = "") {
    app.use(initOAuthGoogle({
        GOOGLE_CLIENT_ID    : "150032486069-n9lbjqif9ucmu84bmc00jcm70hfiat0u.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "u64PkUyI8cdYufa3Fsi8Id_q",
        urlPrefix           : urlPrefix
    }));
    app.use(initOAuthFacebook({
        FACEBOOK_APP_ID     : "1109157522518747",
        FACEBOOK_APP_SECRET : "4eef17abc775beb2932bdf01ccd545e5",
        urlPrefix           : urlPrefix
    }));
    passport.serializeUser( (user: PassportUser, done) => {
        registerUser(user);
        done(null, user.id);
    });
    passport.deserializeUser( (id: string, done) => {
        const user = getUserFromId(id);
        done(null, user ? user : false );
    });
}

let passportUsers = new Map<string, PassportUser>();

export function getUserFromId(id: string): PassportUser {
    return passportUsers.get(id);
}

export function registerUser(user: PassportUser) {
    return passportUsers.set(user.id, user);
}

// Check if client is authentified
export function checkIsAuthentified(statusIfFailed: number, ressourceIfFailed: string | JSON) {
    return (req, res, next) => {
        if (req.isAuthenticated()) { // if user is authenticated in the session, carry on
            next();
        } else { // Error 401 if not authentified
            res.status(statusIfFailed);
            if (typeof ressourceIfFailed === "string") {
                res.redirect(ressourceIfFailed);
            } else {
                res.json({error: "YOU ARE NOT LOGGED IN"});
            }
        }
    };
}

