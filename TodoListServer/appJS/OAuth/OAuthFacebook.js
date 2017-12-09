"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const passport = require("passport");
const passport_facebook_1 = require("passport-facebook");
const express_1 = require("express");
const User_1 = require("@User/User");
function initOAuthFacebook(config) {
    const { FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, urlPrefix } = config;
    passport.use(new passport_facebook_1.Strategy({
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: `${urlPrefix}/auth/facebook/callback`,
        profileFields: ["id", "displayName", "name", "gender", "emails", "picture.type(large)"]
    }, (accessToken, refreshToken, profile, done) => {
        const emails = profile.emails || [];
        const photos = profile.photos || [];
        const user = {
            name: profile.displayName,
            id: profile.id,
            token: accessToken,
            provider: "facebook",
            emails: emails.map(val => val.value),
            photos: photos.map(val => val.value),
        };
        User_1.getOrCreateUser(user);
        done(null, user);
    }));
    const routerFacebookPassport = express_1.Router();
    routerFacebookPassport.get("/auth/facebook", passport.authenticate("facebook", { scope: "email" }));
    routerFacebookPassport.get("/auth/facebook/callback", passport.authenticate("facebook", {
        failureRedirect: "/login",
        successRedirect: "/"
    }));
    return routerFacebookPassport;
}
exports.initOAuthFacebook = initOAuthFacebook;
