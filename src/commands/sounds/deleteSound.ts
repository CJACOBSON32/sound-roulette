import {AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";

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

    const sounds = await guild.soundboardSounds.fetch();
    const sound = sounds.find(sound => sound.name === soundName);

    if (!sound) {
        throw new Error(`Sound **${soundName}** was not found`);
    }

    await sound.delete();
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
