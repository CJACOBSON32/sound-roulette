import Papa from "papaparse";
import {Readable} from "node:stream";
import {readFileSync} from "node:fs";

export async function streamFromUrl(url: string) {
    const response = await fetch(url);
    if (!response.body) {
        throw new Error(`No file at URL ${url}`);
    }

    // @ts-ignore
    return Readable.fromWeb(response.body);
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

export const emojis = csvToObject('emojis.csv') as {unicode: string, character: string, cldr_short_name: string}[];