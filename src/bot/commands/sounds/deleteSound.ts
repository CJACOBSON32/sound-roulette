import {AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import {deleteSound} from "@/services/soundboard";

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

    await deleteSound(guild, soundName);

    await interaction.reply(`Sound **${soundName}** deleted successfully!`);
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    if (interaction.options.getFocused(true).name === 'name') {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const guild = interaction.guild!;

        const sounds = await guild.soundboardSounds.fetch();

        const matchingSounds = sounds
            .filter(sound => sound.name.toLowerCase().startsWith(focusedValue))
            .first(25);

        await interaction.respond(
            matchingSounds.map(sound => ({
                name: sound.name,
                value: sound.name
            }))
        );
    }
}
