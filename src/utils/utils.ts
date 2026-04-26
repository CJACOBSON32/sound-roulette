import * as http from "node:http";
import * as fs from "node:fs";
import {Readable} from "node:stream";

export async function streamFromUrl(url: string) {
    const response = await fetch(url);
    if (!response.body) {
        throw new Error(`No file at URL ${url}`);
    }

    // @ts-ignore
    return Readable.fromWeb(response.body);
}

export function isEmoji(emoji: string) {
    const ranges = [
        '\ud83c[\udf00-\udfff]', // U+1F300 to U+1F3FF
        '\ud83d[\udc00-\ude4f]', // U+1F400 to U+1F64F
        '\ud83d[\ude80-\udeff]' // U+1F680 to U+1F6FF
    ].join(' | ');
    return (emoji.match(new RegExp(ranges, 'g'))?.length ?? 0) > 0;
}