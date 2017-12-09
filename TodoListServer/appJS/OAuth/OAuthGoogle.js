"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport = require("passport");
const passport_google_oauth_1 = require("passport-google-oauth");
const express_1 = require("express");
const User_1 = require("@User/User");
function initOAuthGoogle(config) {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, urlPrefix } = config;
    passport.use(new passport_google_oauth_1.OAuth2Strategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${urlPrefix}/auth/google/callback`
    }, (accessToken, refreshToken, profile, done) => {
        const emails = profile.emails || [];
        const photos = profile.photos || [];
        const user = {
            name: profile.displayName,
            id: profile.id,
            token: accessToken,
            emails: emails.map(val => val.value),
            photos: photos.map(val => val.value),
            provider: "google"
        };
        User_1.getOrCreateUser(user);
        console.log("getOrCreateUser", user);
        done(null, user);
    }));
    const routerGooglePassport = express_1.Router();
    routerGooglePassport.get("/auth/google", (request, response, next) => {
        // passport.authenticate("google", {scope: ["https://www.googleapis.com/auth/plus.login"]})
        passport.authenticate("google", { scope: ["profile", "email"] })(request, response, next);
    });
    routerGooglePassport.get("/auth/google/callback", (request, response, next) => {
        passport.authenticate("google", {
            failureRedirect: "/login",
            successRedirect: "/"
        })(request, response, next);
    });
    return routerGooglePassport;
}
exports.initOAuthGoogle = initOAuthGoogle;
