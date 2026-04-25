// import discord.js
import {Client, MessageFlagsBitField, Events, GatewayIntentBits} from "discord.js";
import {commandUtils, registerCommands} from "./util/commandUtils";

// create a new Client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// listen for the client to be ready
client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
});

// login with the token from .env.local
client.login(process.env.DISCORD_TOKEN);

const commands = commandUtils(__dirname + '/commands');

registerCommands(process.env.DISCORD_TOKEN!, process.env.DISCORD_CLIENT_ID!, commands);

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const command = commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: 'There was an error while executing this command!',
                flags: MessageFlagsBitField.Flags.Ephemeral,
            });
        } else {
            await interaction.reply({
                content: 'There was an error while executing this command!',
                flags: MessageFlagsBitField.Flags.Ephemeral,
            });
        }
    }
});