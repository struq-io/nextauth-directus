"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
/** @return { import("next-auth/adapters").Adapter } */
function DirectusAdapter({ client: directus, assignRole, }) {
    return {
        createUser: (user) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            return (_a = (yield directus.users.createOne(Object.assign(Object.assign({}, user), { role: assignRole ? assignRole : null })))) !== null && _a !== void 0 ? _a : null;
        }),
        getUser: (id) => __awaiter(this, void 0, void 0, function* () { var _b; return (_b = (yield directus.users.readOne(id))) !== null && _b !== void 0 ? _b : null; }),
        getUserByEmail: (email) => __awaiter(this, void 0, void 0, function* () {
            var _c, _d;
            return (_d = (_c = (yield directus.users.readByQuery({
                filter: { email: { _eq: email } },
                limit: 1,
            })).data) === null || _c === void 0 ? void 0 : _c[0]) !== null && _d !== void 0 ? _d : null;
        }),
        getUserByAccount: ({ provider, providerAccountId }) => __awaiter(this, void 0, void 0, function* () {
            var _e;
            return (_e = (yield directus
                .items("account")
                .readByQuery({
                filter: {
                    provider: { _eq: provider },
                    providerAccountId: { _eq: providerAccountId },
                },
                fields: ["userId"],
                limit: 1,
            })
                .then((result) => { var _a; return (_a = result.data) === null || _a === void 0 ? void 0 : _a[0]; })
                .then((account) => directus.users.readOne(account === null || account === void 0 ? void 0 : account.userId)))) !== null && _e !== void 0 ? _e : null;
        }),
        updateUser: (_f) => __awaiter(this, void 0, void 0, function* () {
            var { id } = _f, user = __rest(_f, ["id"]);
            return (yield directus.users.updateOne(id, nullsToUndefined(user)));
        }),
        deleteUser: (id) => __awaiter(this, void 0, void 0, function* () { return yield directus.users.deleteOne(id); }),
        linkAccount: (data) => __awaiter(this, void 0, void 0, function* () { return (yield directus.items("account").createOne(data)); }),
        unlinkAccount: ({ provider, providerAccountId }) => __awaiter(this, void 0, void 0, function* () {
            return (yield directus
                .items("account")
                .readByQuery({
                filter: {
                    provider: { _eq: provider },
                    providerAccountId: { _eq: providerAccountId },
                },
                limit: 1,
                fields: ["id"],
            })
                .then((result) => { var _a, _b; return (_b = (_a = result.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id; })
                .then((id) => directus.items("account").deleteOne(id)));
        }),
        createSession: (session) => __awaiter(this, void 0, void 0, function* () {
            const createdSession = (yield directus
                .items("session")
                .createOne(session));
            return Object.assign(Object.assign({}, createdSession), { expires: new Date(createdSession.expires) });
        }),
        updateSession: (session) => __awaiter(this, void 0, void 0, function* () {
            return (yield directus
                .items("session")
                .readByQuery({
                filter: { sessionToken: { _eq: session.sessionToken } },
                limit: 1,
                fields: ["id"],
            })
                .then((result) => { var _a, _b; return (_b = (_a = result.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id; })
                .then((id) => directus.items("session").updateOne(id, session)));
        }),
        deleteSession: (session) => __awaiter(this, void 0, void 0, function* () {
            return (yield directus
                .items("session")
                .readByQuery({
                filter: { sessionToken: { _eq: session } },
                limit: 1,
                fields: ["id"],
            })
                .then((result) => { var _a, _b; return (_b = (_a = result.data) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id; })
                .then((id) => directus.items("session").deleteOne(id)));
        }),
        createVerificationToken: (token) => __awaiter(this, void 0, void 0, function* () {
            const check = yield directus.items("verificationToken").readByQuery({
                filter: { identifier: { _eq: token.identifier } },
                limit: 1,
            });
            if (check.data && check.data.length > 0) {
                return (yield directus
                    .items("verificationToken")
                    .updateOne(token.identifier, token));
            }
            else {
                return (yield directus
                    .items("verificationToken")
                    .createOne(token));
            }
        }),
        useVerificationToken: ({ token, identifier }) => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield directus
                    .items("verificationToken")
                    .readByQuery({
                    filter: { token: { _eq: token }, identifier: { _eq: identifier } },
                    limit: 1,
                })
                    .then((result) => { var _a; return (_a = result.data) === null || _a === void 0 ? void 0 : _a[0]; })
                    .then((token) => __awaiter(this, void 0, void 0, function* () {
                    yield directus.items("verificationToken").deleteOne(identifier);
                    return token;
                }))
                    .then((token) => {
                    return token;
                });
            }
            catch (error) {
                throw error;
                return null;
            }
        }),
        getSessionAndUser: (sessionToken) => __awaiter(this, void 0, void 0, function* () {
            var _g;
            try {
                const session = (_g = (yield directus.items("session").readByQuery({
                    filter: { sessionToken: { _eq: sessionToken } },
                    limit: 1,
                })).data) === null || _g === void 0 ? void 0 : _g[0];
                const user = (yield directus.users.readOne(session.userId));
                if (user && session) {
                    return {
                        session: Object.assign(Object.assign({}, session), { expires: new Date(session.expires) }),
                        user,
                    };
                }
                else {
                    return null;
                }
            }
            catch (err) {
                console.error(err);
                return null;
            }
        }),
    };
}
exports.default = DirectusAdapter;
function nullsToUndefined(obj) {
    if (obj === null) {
        return undefined;
    }
    // object check based on: https://stackoverflow.com/a/51458052/6489012
    if (typeof obj === "object" && obj !== null) {
        for (let key in obj) {
            obj[key] = nullsToUndefined(obj[key]);
        }
    }
    return obj;
}
