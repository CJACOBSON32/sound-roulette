import {AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import {removeSound} from "@/services/soundboard";
import {searchSounds} from "@/services/soundboardDB";

export const data = new SlashCommandBuilder()
    .setName('delete-sound')
    .setDescription("Remove a sound from the server")
    .addStringOption(option =>
        option.setName('name')
            .setDescription('The name of the sound to delete')
            .setRequired(true)
            .setAutocomplete(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    const soundName = interaction.options.getString('name')!;

    await removeSound(guild, soundName);

    await interaction.reply(`Sound **${soundName}** deleted successfully!`);
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    if (interaction.options.getFocused(true).name === 'name') {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const guild = interaction.guild!;

        const matchingSounds = await searchSounds(BigInt(guild.id), focusedValue);

        await interaction.respond(
            matchingSounds.map(sound => ({
                name: sound.name,
                value: sound.name
            }))
        );
    }
}
