import initializeDiscordBot from "@/bot/discordBot";
import {importSoundsFromGuild} from "@/services/soundboard";
import {getGuilds} from "@/services/database/guildDB";


async function main() {
    const client = await initializeDiscordBot();

    const guilds = await getGuilds();

    let importedGuilds: number = 0;
    let importedSounds: number = 0;
    for (const guild of guilds) {
        const discordGuild = await client.guilds.fetch(guild.guildId.toString());

        if (discordGuild && guild.isActive) {
            const numImported = await importSoundsFromGuild(discordGuild);
            importedGuilds++;
            importedSounds += numImported;
        }
    }

    if (importedGuilds > 0) {
        console.log(`Imported ${importedSounds} sound${importedSounds > 1 ? 's' : ''} from ${importedGuilds} guild${importedGuilds > 1 ? 's' : ''}`);
    }
}

(async () => (await main()))();