import {db} from "@/db";
import {guilds} from "@/db/schema";
import {and, eq} from "drizzle-orm";
import {Guild} from "discord.js";

export async function getGuild(guildId: bigint) {
    return db.query.guilds.findFirst({
        with: {config: true},
        where: and(
            eq(guilds.guildId, guildId),
            eq(guilds.isDeleted, false)
        ),
    }) ?? null;
}

export async function addGuild(guild: Guild) {
    const newGuild = await db.insert(guilds).values({
        guildName: guild.name,
        guildId: BigInt(guild.id),
        joinedAt: guild.joinedAt,
        isActive: true
    }).returning();

    return newGuild[0];
}