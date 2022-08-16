import type {
  Adapter,
  AdapterSession,
  AdapterUser,
  VerificationToken,
} from "next-auth/adapters";
import { Directus } from "@directus/sdk";

type UserType = {
  emailVerified: Date;
};

export type DirectusAuth = {
  directus_users: UserType;
};

export type AdapterProps = {
  client: Directus<DirectusAuth>;
  assignRole?: string;
};

/** @return { import("next-auth/adapters").Adapter } */
export const DirectusAdapter = ({
  client: directus,
  assignRole,
}: AdapterProps): Adapter => {
  return {
    createUser: async (user) =>
      ((await directus.users.createOne({
        ...user,
        role: assignRole ? assignRole : null,
      })) as AdapterUser) ?? null,
    getUser: async (id) =>
      ((await directus.users.readOne(id)) as AdapterUser) ?? null,
    getUserByEmail: async (email) =>
      (
        (
          await directus.users.readByQuery({
            filter: { email: { _eq: email } },
            limit: 1,
          })
        ).data as AdapterUser[]
      )?.[0] ?? null,
    getUserByAccount: async ({ provider, providerAccountId }) =>
      ((await directus
        .items("account")
        .readByQuery({
          filter: {
            provider: { _eq: provider },
            providerAccountId: { _eq: providerAccountId },
          },
          fields: ["userId"],
          limit: 1,
        })
        .then((result) => result.data?.[0])
        .then((account) =>
          directus.users.readOne(account?.userId)
        )) as AdapterUser) ?? null,
    updateUser: async ({ id, ...user }) =>
      (await directus.users.updateOne(
        id!,
        nullsToUndefined(user)
      )) as AdapterUser,
    deleteUser: async (id) => await directus.users.deleteOne(id),
    linkAccount: async (data) =>
      (await directus.items("account").createOne(data)) as any,
    unlinkAccount: async ({ provider, providerAccountId }) =>
      (await directus
        .items("account")
        .readByQuery({
          filter: {
            provider: { _eq: provider },
            providerAccountId: { _eq: providerAccountId },
          },
          limit: 1,
          fields: ["id"],
        })
        .then((result) => result.data?.[0]?.id)
        .then((id) => directus.items("account").deleteOne(id))) as any,
    createSession: async (session) => {
      const createdSession = (await directus
        .items("session")
        .createOne(session)) as AdapterSession;

      return { ...createdSession, expires: new Date(createdSession.expires) };
    },
    updateSession: async (session) =>
      (await directus
        .items("session")
        .readByQuery({
          filter: { sessionToken: { _eq: session.sessionToken } },
          limit: 1,
          fields: ["id"],
        })
        .then((result) => result.data?.[0]?.id)
        .then((id) =>
          directus.items("session").updateOne(id, session)
        )) as AdapterSession,
    deleteSession: async (session) =>
      (await directus
        .items("session")
        .readByQuery({
          filter: { sessionToken: { _eq: session } },
          limit: 1,
          fields: ["id"],
        })
        .then((result) => result.data?.[0]?.id)
        .then((id) =>
          directus.items("session").deleteOne(id)
        )) as AdapterSession,
    createVerificationToken: async (token) => {
      const check = await directus.items("verificationToken").readByQuery({
        filter: { identifier: { _eq: token.identifier } },
        limit: 1,
      });
      if (check.data && check.data.length > 0) {
        return (await directus
          .items("verificationToken")
          .updateOne(token.identifier, token)) as VerificationToken;
      } else {
        return (await directus
          .items("verificationToken")
          .createOne(token)) as VerificationToken;
      }
    },
    useVerificationToken: async ({ token, identifier }) => {
      try {
        return await directus
          .items("verificationToken")
          .readByQuery({
            filter: { token: { _eq: token }, identifier: { _eq: identifier } },
            limit: 1,
          })
          .then((result) => result.data?.[0])
          .then(async (token) => {
            await directus.items("verificationToken").deleteOne(identifier);
            return token;
          })
          .then((token) => {
            return token as VerificationToken;
          });
      } catch (error) {
        throw error;
        return null;
      }
    },
    getSessionAndUser: async (sessionToken) => {
      try {
        const session = (
          await directus.items("session").readByQuery({
            filter: { sessionToken: { _eq: sessionToken } },
            limit: 1,
          })
        ).data?.[0] as AdapterSession;

        const user = (await directus.users.readOne(
          session.userId
        )) as AdapterUser;

        if (user && session) {
          return {
            session: { ...session, expires: new Date(session.expires) },
            user,
          };
        } else {
          return null;
        }
      } catch (err) {
        console.error(err);
        return null;
      }
    },
  };
};

type RecursivelyReplaceNullWithUndefined<T> = T extends null
  ? undefined
  : T extends Date
  ? T
  : {
      [K in keyof T]: T[K] extends (infer U)[]
        ? RecursivelyReplaceNullWithUndefined<U>[]
        : RecursivelyReplaceNullWithUndefined<T[K]>;
    };

function nullsToUndefined<T>(obj: T): RecursivelyReplaceNullWithUndefined<T> {
  if (obj === null) {
    return undefined as any;
  }

  // object check based on: https://stackoverflow.com/a/51458052/6489012
  if (typeof obj === "object" && obj !== null) {
    for (let key in obj) {
      obj[key] = nullsToUndefined(obj[key]) as any;
    }
  }
  return obj as any;
}
