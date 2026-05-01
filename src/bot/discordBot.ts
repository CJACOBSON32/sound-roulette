// import discord.js
import {Client, MessageFlagsBitField, Events, GatewayIntentBits} from "discord.js";
import {commandUtils, processInteraction, registerCommands} from "./commandUtils";
import {addGuild, getGuild} from "@/services/guildDB";

export default function initializeDiscordBot() {
    // create a new Client instance
    const client = new Client({intents: [GatewayIntentBits.Guilds]});

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
    client.login(process.env.DISCORD_TOKEN);

    // Register commands
    const commands = commandUtils(__dirname + '/commands');
    registerCommands(process.env.DISCORD_TOKEN!, process.env.DISCORD_CLIENT_ID!, commands);

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
}
