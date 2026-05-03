import {db} from "@/db";
import {guildConfigs, guilds} from "@/db/schema";
import {and, eq} from "drizzle-orm";
import {Guild} from "discord.js";
import {importSoundsFromGuild} from "@/services/soundboard";

export async function getGuilds() {
    return db.query.guilds.findMany({
        with: {config: true},
        where: eq(guilds.isDeleted, false)
    });
}

export async function getGuild(guildId: bigint, withSounds: boolean = false) {
    return db.query.guilds.findFirst({
        with: {
            config: true,
            sounds: withSounds ? true : undefined
        },
        where: and(
            eq(guilds.guildId, guildId),
            eq(guilds.isDeleted, false)
        ),
    }) ?? null;
}

export async function addGuild(guild: Guild, importSounds: boolean = true) {
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

    if (importSounds)
        await importSoundsFromGuild(guild);

    return getGuild(guildId);
}