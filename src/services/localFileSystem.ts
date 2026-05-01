import {readdir} from "node:fs/promises";
import path from 'path';
import RouletteFileSystem from "@/services/fileSystem";

/**
 * File system implementation using Bun
 */
export default class LocalFileSystem implements RouletteFileSystem {
    async getFiles(dirPath: string = '') {
        const soundsDir = path.join('./sounds', dirPath);
        return await readdir(soundsDir);
    }

    async saveFile(fileName: string, data: Buffer) {
        const filePath = path.join('./sounds', fileName);
        await Bun.write(filePath, data)
        return filePath;
    }

    async loadFile(fileName: string) {
        const filePath = path.join('./sounds', fileName);
        const file = Bun.file(filePath);
        return Buffer.from(await file.arrayBuffer());
    }
}
