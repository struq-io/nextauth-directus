import type { Adapter } from "next-auth/adapters";
import { Directus } from "@directus/sdk";
declare type UserType = {
    emailVerified: Date;
};
export declare type DirectusAuth = {
    directus_users: UserType;
};
export declare type AdapterProps = {
    client: Directus<DirectusAuth>;
    assignRole?: string;
};
/** @return { import("next-auth/adapters").Adapter } */
export default function DirectusAdapter({ client: directus, assignRole, }: AdapterProps): Adapter;
export {};
