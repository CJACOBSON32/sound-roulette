/**
 * Interface for a file system to read and write files
 */
export default interface RouletteFileSystem {
    /**
     * Get all files in a directory
     * @param dirPath Path to the directory
     * @returns Array of file names
     */
    getFiles: (dirPath?: string) => Promise<string[]>;

    /**
     * Save a file to the file system
     * @param filePath Path to the file
     * @param data Data to save
     * @returns File path
     */
    saveFile: (filePath: string, data: Buffer) => Promise<string>;

    /**
     * Load a file from the file system
     * @param filePath Path to the file
     * @returns File data
     */
    loadFile: (filePath: string) => Promise<Buffer>;
}


