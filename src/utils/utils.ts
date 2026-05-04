import Papa from "papaparse";
import {readFileSync} from "node:fs";
import {pathToFileURL} from "node:url";

export async function streamFromUrl(url: string) {
    const response = await fetch(url);

    if (!response.body) {
        throw new Error(`No file at URL ${url}`);
    }

    return response.body;
}

export function isEmoji(emoji: string) {
    const regex = /\p{Emoji_Presentation}/gu;
    return regex.test(emoji);
}

export function csvToObject(path: string) {
    // Load CSV file into a string
    const fileContent = readFileSync(path, 'utf8');

    // Using Papa Parse library
    return Papa.parse(fileContent, {
        header: true, // Converts rows to objects using the first row as keys
    }).data;
}

export type EmojiInfo = {unicode: string, character: string, cldr_short_name: string};

export const emojis = csvToObject('emojis.csv') as EmojiInfo[];

export const environment = {
    discordToken: process.env.DISCORD_TOKEN!,
    discordCLientId: process.env.DISCORD_CLIENT_ID!,
    databaseUrl: process.env.DATABASE_URL!,
    databasePort: parseInt(process.env.DATABASE_PORT!),
    databaseUsername: process.env.DATABASE_USERNAME!,
    databasePassword: process.env.DATABASE_PASSWORD!,
    databaseName: process.env.DATABASE_NAME!
}

export async function streamToBuffer(stream: ReadableStream): Promise<Buffer> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        chunks.push(value);
    }

    return Buffer.concat(chunks);
}

export async function fileUrlToBuffer(url: string) {
    return streamToBuffer(await streamFromUrl(url));
}