import {ChatInputCommandInteraction, SlashCommandBuilder} from "discord.js";
import {isEmoji, streamFromUrl} from "../../utils/utils";

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
    ).addAttachmentOption(option =>
        option.setName('sound')
            .setDescription('The sound file to upload')
            .setRequired(true)
    );

export async function execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    const soundName = interaction.options.getString('name')!;
    const attachment = interaction.options.getAttachment('sound')!;
    const emojiName = interaction.options.getString('emoji')!;
    if (!isEmoji(emojiName)) {
        throw new Error('Must use a valid unicode emoji');
    }

    const stream = await streamFromUrl(attachment.url);
    if (!stream) {
        throw new Error('Failed to create stream from URL');
    }

    await guild.soundboardSounds.create({
        name: soundName,
        file: stream,
        emojiName: emojiName
    });

    await interaction.reply(`Sound **${soundName}** uploaded successfully!`);
}
