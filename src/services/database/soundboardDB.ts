import {db} from "@/db";
import {activeSlotHistory, sounds} from "@/db/schema";
import RouletteFileSystem from "@/services/fileSystem";
import LocalFileSystem from "@/services/localFileSystem";
import {and, desc, eq, ilike} from "drizzle-orm";

const fileSystem: RouletteFileSystem = new LocalFileSystem();

export async function addSoundToDB(
    guildId: bigint, soundName: string, emoji: string, uploadedBy: bigint, file: Buffer, active: boolean = false
) {
    const fileName = `${soundName}.mp3`;

    const sound = (await db.insert(sounds).values({
        guildId: guildId,
        name: soundName,
        emoji: emoji,
        uploadedBy: uploadedBy,
        file: fileName,
        isActive: active
    }).returning())[0];

    await fileSystem.saveFile(fileName, file);

    if (active) {
        await db.insert(activeSlotHistory).values({
            guildId: guildId,
            soundId: sound.soundId
        })
    }
}

export async function getSound(guildId: bigint, soundName: string) {
    const result = await db.select()
        .from(sounds)
        .where(and(
            eq(sounds.guildId, BigInt(guildId)),
            eq(sounds.name, soundName),
            eq(sounds.isDeleted, false)))
        .limit(1)

    if (result.length === 0) {
        return null;
    }

    return result[0];
}

export async function searchSounds(guildId: bigint, searchTerm: string) {
    return db.select()
        .from(sounds)
        .where(and(
            eq(sounds.guildId, BigInt(guildId)),
            eq(sounds.isDeleted, false),
            ilike(sounds.name, `${searchTerm}%`)
        ));
}

export async function removeSoundFromDB(guildId: bigint, soundName: string) {
    const fileName = `${soundName}.mp3`;
    await fileSystem.loadFile(fileName);
    await db.update(sounds)
        .set({isDeleted: true})
        .where(and(
            eq(sounds.guildId, BigInt(guildId)),
            eq(sounds.name, soundName),
            eq(sounds.isDeleted, false)
        ));
}

export async function listSounds(guildId: bigint) {
    return db.select()
        .from(sounds)
        .where(and(
            eq(sounds.guildId, guildId),
            eq(sounds.isDeleted, false)
        ))
        .orderBy(desc(sounds.createdAt));
}

export async function clearDeletedSounds(guildId: bigint | null = null) {
    const whereClause
        = guildId ? and(eq(sounds.guildId, BigInt(guildId)), eq(sounds.isDeleted, true)) : eq(sounds.isDeleted, true);

    const deletedSounds = await db
        .select()
        .from(sounds)
        .where(whereClause);

    for (const sound of deletedSounds) {
        await fileSystem.deleteFile(sound.file);
    }

    await db.delete(sounds)
        .where(whereClause);
}
