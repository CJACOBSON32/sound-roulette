import {ApplicationCommand, Routes, Collection, CommandInteraction, REST, SlashCommandBuilder} from "discord.js";
import * as path from "node:path";
import * as fs from "node:fs";

export type Command = {
    data: SlashCommandBuilder;
    execute: (interaction: CommandInteraction) => Promise<void>;
}

/**
 * Gets all commands from a directory
 * @param commandsDirectory Directory to get commands from
 * @returns Collection of commands
 */
export function commandUtils(commandsDirectory: string): Collection<string, Command> {
    const commands = new Collection<string, Command>();

    const commandFolders = fs.readdirSync(commandsDirectory);

    for (const folder of commandFolders) {
        const commandsPath = path.join(commandsDirectory, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts'));
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath) as Command;
            // Set a new item in the Collection with the key as the command name and the value as the exported module
            if ('data' in command && 'execute' in command) {
                commands.set(command.data.name, command);
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }

    return commands;
}

/**
 * Registers commands with Discord API
 * @param token Discord bot token
 * @param clientId Discord application client ID
 * @param commands Collection of commands to register
 */
export async function registerCommands(token: string, clientId: string, commands: Collection<string, Command>) {
    // Construct and prepare an instance of the REST module
    const rest = new REST().setToken(token);

    const commandList = commands.map(command => command.data.toJSON());

    try {
        console.log(`Started refreshing ${commandList.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(Routes.applicationCommands(clientId), { body: commandList }) as ApplicationCommand[];
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
}
