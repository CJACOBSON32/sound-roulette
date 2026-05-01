import {BufferResolvable, Guild, User} from "discord.js";
import {Readable} from "node:stream";
import {ReadableStream as NodeReadableStream} from "node:stream/web";
import {db} from "@/db";
import {Sound, sounds, users} from "@/db/schema";
import {and, eq} from "drizzle-orm";
import {addSoundToDB, getSound, listSounds, removeSoundFromDB} from "@/services/soundboardDB";
import {streamToBuffer} from "@/utils/utils";
import {addGuild, getGuild} from "@/services/guildDB";

/**
 * Uploads a sound to the server
 * @param guild Guild to upload sound to
 * @param user User who uploaded the sound
 * @param soundName Name of the sound
 * @param emoji Unicode emoji to use for the sound
 * @param file File stream to upload
 * @param addToDiscord Whether to add the sound to Discord as well
 */
export async function uploadSound(
    guild: Guild, user: User, soundName: string, emoji: string, file: ReadableStream, addToDiscord: boolean = false
) {
    const buffer = await streamToBuffer(file);

    const userId = BigInt(user.id);

    const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.userId, userId))
        .limit(1);

    if (existingUser.length === 0) {
        await db.insert(users).values({
            userId: BigInt(user.id),
            username: user.username
        });
    }

    // Create guild if it doesn't exist'
    const existingGuild = await getGuild(BigInt(guild.id));
    if (!existingGuild) {
        await addGuild(guild);
    }

    await addSoundToDB(BigInt(guild.id), soundName, emoji, userId, buffer);

    if (addToDiscord) {
        await addSoundToDiscord(guild, soundName, emoji, buffer);
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
    guild: Guild, soundName: string, emoji: string, file: BufferResolvable, makeRoom: boolean = true
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
 * @param guild
 * @param soundName
 * @param emoji
 * @param file
 */
async function createDiscordSound(guild: Guild, soundName: string, emoji: string, file: BufferResolvable) {
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

    await removeSoundFromDB(guildId, soundName);

    if (sound.isActive) {
        await guild.soundboardSounds.delete(sound.name);
    }
}
