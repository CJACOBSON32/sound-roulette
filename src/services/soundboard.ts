import {Guild} from "discord.js";
import {Readable} from "node:stream";
import {ReadableStream as NodeReadableStream} from "node:stream/web";

export async function uploadSound(guild: Guild, soundName: string, emoji: string, file: ReadableStream) {
    const nodeStream = Readable.fromWeb(file as unknown as NodeReadableStream)

    await guild.soundboardSounds.create({
        name: soundName,
        file: nodeStream,
        emojiName: emoji
    });
}

export async function deleteSound(guild: Guild, soundName: string) {
    const sounds = await guild.soundboardSounds.fetch();
    const sound = sounds.find(sound => sound.name === soundName);

    if (!sound) {
        throw new Error(`Sound **${soundName}** was not found`);
    }

    await sound.delete();
}