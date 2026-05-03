import {AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import {EmojiInfo, emojis, fileUrlToBuffer, isEmoji, streamFromUrl} from "../../../utils/utils";
import {uploadSound} from "@/services/soundboard";

export const data = new SlashCommandBuilder()
    .setName('upload-sound')
    .setDescription('Upload a sound to the server')
    .addStringOption(option =>
        option.setName('name')
            .setDescription('The name of the sound')
            .setRequired(true)
    ).addStringOption(option =>
        option.setName('emoji')
            .setDescription('The unicode emoji to use for the sound')
            .setRequired(true)
            .setAutocomplete(true)
    ).addAttachmentOption(option =>
        option.setName('sound')
            .setDescription('The sound file to upload')
            .setRequired(true)
    ).addBooleanOption(option =>
        option.setName('add-to-discord')
            .setDescription('Whether to add the sound to Discord as well')
            .setRequired(false));

export async function execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    const soundName = interaction.options.getString('name')!;
    const attachment = interaction.options.getAttachment('sound')!;
    const emojiName = interaction.options.getString('emoji')!;
    const addToDiscord = interaction.options.getBoolean('add-to-discord') ?? false;
    if (!isEmoji(emojiName)) {
        throw new Error('Must use a valid unicode emoji');
    }

    const buffer = await fileUrlToBuffer(attachment.url);
    if (!buffer) {
        throw new Error('Failed to create bufer from URL');
    }

    await uploadSound(guild, interaction.user, soundName, emojiName, buffer, addToDiscord);

    await interaction.reply(`Sound **${soundName}** uploaded successfully!`);
}

export async function autocomplete(interaction: AutocompleteInteraction) {
    if (interaction.options.getFocused(true).name === 'emoji') {
        const focusedValue = interaction.options.getFocused();

        const emojiList = [] as EmojiInfo[];
        if (focusedValue) {
            const filteredEmojis = emojis.filter(emoji => emoji.cldr_short_name.startsWith(focusedValue));
            emojiList.push(...filteredEmojis);
        }
        else {
            emojiList.push(...emojis.slice(0, 25));
        }

        const maxLength = 25;
        await interaction.respond(
            emojiList.map(emoji => ({
                name: `${emoji.character} ${emoji.cldr_short_name}`.slice(0, maxLength),
                value: emoji.character.slice(0, maxLength)
            }))
        );
    }
}
