import * as passport from "passport";
import {Strategy as FacebookStrategy} from "passport-facebook";
import {Router/*, Request, Response*/} from "express";
import {PassportUser} from "@data/protocol";
import {getOrCreateUser} from "@User/User";

export function initOAuthFacebook(config: {FACEBOOK_APP_ID: string, FACEBOOK_APP_SECRET: string, urlPrefix: string}): Router {
    const {FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, urlPrefix} = config;
    passport.use(new FacebookStrategy({
            clientID: FACEBOOK_APP_ID,
            clientSecret: FACEBOOK_APP_SECRET,
            callbackURL: `${urlPrefix}/auth/facebook/callback`,
            profileFields: ["id", "displayName", "name", "gender", "emails", "picture.type(large)"]
        },
        (accessToken, refreshToken, profile, done: (err: any, user: PassportUser) => any) => {
            const emails = profile.emails || [];
            const photos = profile.photos || [];
            const user: PassportUser = {
                name: profile.displayName,
                id: profile.id,
                token: accessToken,
                provider: "facebook",
                emails: emails.map(val => val.value),
                photos: photos.map(val => val.value),
            };
            getOrCreateUser(user);
            done(null, user);
        }
    ));

    const routerFacebookPassport: Router = Router();

    routerFacebookPassport.get("/auth/facebook",
        passport.authenticate("facebook", {scope: "email"})
    );

    routerFacebookPassport.get(
        "/auth/facebook/callback",
        passport.authenticate("facebook", {
            failureRedirect: "/login",
            successRedirect: "/"
        })
    );

    return routerFacebookPassport;
}
