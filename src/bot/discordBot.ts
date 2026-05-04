// import discord.js
import {Client, Events, GatewayIntentBits, GuildSoundboardSound} from "discord.js";
import {commandUtils, processInteraction, registerCommands} from "./commandUtils";
import {addGuild, getGuild} from "@/services/database/guildDB";
import {importSound, setSoundActive} from "@/services/soundboard";
import {getSound, removeSoundFromDB} from "@/services/database/soundboardDB";

export default async function initializeDiscordBot() {
    // create a new Client instance
    const client = new Client({intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildExpressions
    ]});

    // listen for the client to be ready
    client.once(Events.ClientReady, c => {
        console.log(`Ready! Logged in as ${c.user.tag}`);
    });

    // Validate environment variables
    if (!process.env.DISCORD_TOKEN) {
        throw new Error('DISCORD_TOKEN environment variable is not set');
    }
    if (!process.env.DISCORD_CLIENT_ID) {
        throw new Error('DISCORD_CLIENT_ID environment variable is not set');
    }

    // login with the token from .env.local
    await client.login(process.env.DISCORD_TOKEN);

    // Register commands
    const commands = commandUtils(__dirname + '/commands');
    await registerCommands(process.env.DISCORD_TOKEN!, process.env.DISCORD_CLIENT_ID!, commands);

    // Listen for interactions
    client.on(
        Events.InteractionCreate,
        async (interaction) => processInteraction(interaction, commands)
    );

    client.on(Events.GuildCreate, async guild => {
        const existingGuild = await getGuild(BigInt(guild.id));

        if (!existingGuild) {
            await addGuild(guild);
        }
    });

    // Import added sounds
    client.on(Events.GuildSoundboardSoundCreate, async sound => {
        const dbSound = (await getSound(BigInt(sound.guildId), sound.name))
        const guild = sound.guild;

        if (!dbSound) {
            await importSound(guild, sound);
        }
    })

    // Set deleted sounds as inactive
    client.on(Events.GuildSoundboardSoundDelete, async (sound) => {
        const discordSound = sound as GuildSoundboardSound;
        const guildId = BigInt(discordSound.guildId)
        const dbSound = await getSound(guildId, discordSound.name);

        if (dbSound) {
            await setSoundActive(guildId, discordSound.name, false);
        }
    })

    return client;
}
