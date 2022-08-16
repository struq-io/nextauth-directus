import { defineHook } from "@directus/extensions-sdk";
import type {
  Accountability,
  ApiExtensionContext,
} from "@directus/shared/dist/esm/types";

export default defineHook(({ filter }) => {
  filter("authenticate", async (payload, meta, context) => {
    const nextToken: string | undefined = meta.req.query.next_token;
    console.log(payload);
    if (nextToken) {
      const user = await context
        .database("directus_users")
        .join("session", "session.userId", "=", "directus_users.id")
        .where("sessionToken", nextToken)
        .where("expires", ">", new Date())
        .select("directus_users.id")
        .first();
      if (user) {
        const result = await upgradeAccountability(
          user.id,
          payload as Accountability,
          context.database
        );
        return result;
      }
    }
    return payload;
  });
});

async function upgradeAccountability(
  user: string,
  accountability: Accountability,
  database: ApiExtensionContext["database"]
) {
  const userData = await database
    .select("role", "directus_roles.admin_access", "directus_roles.app_access")
    .from("directus_users")
    .leftJoin("directus_roles", "directus_users.role", "directus_roles.id")
    .where({
      "directus_users.id": user,
      status: "active",
    })
    .first();

  console.log(userData);

  if (!userData) return accountability;

  return {
    ...accountability,
    user,
    role: userData.role,
    admin: userData.admin_access === true || userData.admin_access == 1,
    app: userData.app_access === true || userData.app_access == 1,
  };
}
