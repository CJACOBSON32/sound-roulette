import initializeDiscordBot from "@/bot/discordBot";
import {importSoundsFromGuild} from "@/services/soundboard";
import {getGuilds} from "@/services/database/guildDB";


async function main() {
    const client = await initializeDiscordBot();

    const guilds = await getGuilds();

    let importedGuilds: number = 0;
    for (const guild of guilds) {
        const discordGuild = await client.guilds.fetch(guild.guildId.toString());

        if (discordGuild && guild.isActive) {
            await importSoundsFromGuild(discordGuild);
            importedGuilds++;
        }
    }

    if (importedGuilds > 0) {
        console.log(`Imported from ${importedGuilds} guilds`);
    }
}

(async () => (await main()))();