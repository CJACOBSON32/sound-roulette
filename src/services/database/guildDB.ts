import {db} from "@/db";
import {guildConfigs, guilds} from "@/db/schema";
import {and, eq} from "drizzle-orm";
import {Guild} from "discord.js";

export async function getGuilds() {
    return db.query.guilds.findMany({
        with: {config: true},
        where: eq(guilds.isDeleted, false)
    });
}

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
    const guildId = BigInt(guild.id);

    await db.insert(guilds).values({
        guildName: guild.name,
        guildId: guildId,
        joinedAt: guild.joinedAt,
        isActive: true
    }).returning();

    await db.insert(guildConfigs).values({
        guildId: guildId,
    });

    return getGuild(guildId);
}