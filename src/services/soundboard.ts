import {Guild, SoundboardSound, SoundboardSoundResolvable, User} from "discord.js";
import {db} from "@/db";
import {sounds, users} from "@/db/schema";
import {and, eq, inArray} from "drizzle-orm";
import {addSoundToDB, getSound, removeSoundFromDB} from "./database/soundboardDB";
import {addGuild, getGuild} from "./database/guildDB";
import {getUser} from "@/services/database/userDB";
import {fileUrlToBuffer} from "@/utils/utils";

/**
 * Uploads a sound to the server
 * @param guild Guild to upload sound to
 * @param user User who uploaded the sound
 * @param soundName Name of the sound
 * @param emoji Unicode emoji to use for the sound
 * @param file File stream to upload
 * @param addToDiscord Whether to add the sound to Discord as well
 * @param active Override the active status of the sound
 */
export async function uploadSound(
    guild: Guild, user: User, soundName: string, emoji: string, file: Buffer, addToDiscord: boolean = false, active: boolean = false
) {
    const userId = BigInt(user.id);
    const guildId = BigInt(guild.id);

    // Create guild if it doesn't exist'
    const existingGuild = await getGuild(guildId);
    if (!existingGuild) {
        await addGuild(guild);
    }

    // Create user if it doesn't exist'
    const existingUser = await getUser(userId);
    if (!existingUser) {
        await db.insert(users).values({
            userId: BigInt(user.id),
            username: user.username
        });
    }

    await addSoundToDB(guildId, soundName, emoji, userId, file, addToDiscord || active);

    if (addToDiscord) {
        await addSoundToDiscord(guild, soundName, emoji, file);
    }
}

/**
 * Adds a sound to the Discord server if it doesn't already exist.
 * @param guild Guild to add sound to
 * @param soundName Name of the sound
 * @param emoji Unicode emoji to use for the sound
 * @param file File stream to upload
 * @param makeRoom If **true**, deletes any existing sounds with the same name before adding the new sound.
 * If **false**, throws an error if the sound already exists
 */
export async function addSoundToDiscord(
    guild: Guild, soundName: string, emoji: string, file: Buffer, makeRoom: boolean = true
) {
    const sounds = await guild.soundboardSounds.fetch();
    const sound = sounds.find(sound => sound.name === soundName);

    if (!sound) {
        await createDiscordSound(guild, soundName, emoji, file);
    } else {
        if (makeRoom)
            await guild.soundboardSounds.delete(sound.name);
        else
            throw new Error(`Sound **${soundName}** already exists`);
    }
}

/**
 * Creates a sound in the Discord server. Does not check if the sound already exists.
 * @param guild The guild to create the sound in
 * @param soundName Name of the sound to create
 * @param emoji Unicode emoji to use for the sound
 * @param file File stream to upload
 */
async function createDiscordSound(guild: Guild, soundName: string, emoji: string, file: Buffer) {
    await guild.soundboardSounds.create({
        name: soundName,
        file: file,
        emojiName: emoji
    });
}

/**
 * Deletes a sound from the Discord server
 * @param guild Guild to delete sound from
 * @param soundName sound name to delete
 */
export async function removeSound(guild: Guild, soundName: string) {
    const guildId = BigInt(guild.id);
    const sound = await getSound(guildId, soundName);
    if (!sound) {
        throw new Error(`Sound **${soundName}** does not exist`);
    }

    if (sound.isActive) {
        // TODO: Switch to using discord sound id in DB
        const discordSounds = await guild.soundboardSounds.fetch();
        const discordSound = discordSounds.find(s => s.name === soundName)!;

        await guild.soundboardSounds.delete(discordSound.soundId);
    }

    await removeSoundFromDB(guildId, soundName);
}

export async function setSoundActive(guildId: bigint, soundName: string, soundActive: boolean) {
    await db.update(sounds)
        .set({ isActive: soundActive })
        .where(and(
            eq(sounds.guildId, guildId),
            eq(sounds.name, soundName),
            eq(sounds.isDeleted, false)
        ));
}

export async function importSoundsFromGuild(guild: Guild) {
    const guildId = BigInt(guild.id);
    const guildSounds = [...(await guild.soundboardSounds.fetch()).values()];

    const existingSounds
        = await db.select().
        from(sounds)
        .where(and(
            eq(sounds.guildId, guildId),
            inArray(sounds.name, guildSounds.map(s => s.name))
        ));

    for (const sound of guildSounds) {
        const soundExists = existingSounds.some(s => s.name === sound.name);

        if (soundExists)
            continue;

        await importSound(guild, sound);
    }
}

export async function importSound(guild: Guild, sound: SoundboardSound) {
   const file = await fileUrlToBuffer(sound.url);

    await uploadSound(
        guild,
        sound.user!,
        sound.name,
        sound.emoji?.toString() ?? "",
        file,
        false,
        true
    );
}
