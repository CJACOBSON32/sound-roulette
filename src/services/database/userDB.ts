import {db} from "@/db";
import {users} from "@/db/schema";
import {and, eq} from "drizzle-orm";

export async function getUser(userId: bigint) {
    const user = await db.query.users.findFirst({
        where: eq(users.userId, userId),
        with: {guildMembers: true}
    });

    return user ?? null;
}