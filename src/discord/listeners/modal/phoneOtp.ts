import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalSubmitInteraction,
} from "discord.js";
import {
    getColumnDataofService,
    getServiceData,
} from "../../../services/service.service";

import { generateOtpForDiscordId, sendOtp } from "../../../utils/otp.utils";
import gangstaPhilosophy from "@/customSolutions/gangstaPhilosophy";

export default async (
    interaction: ModalSubmitInteraction,
    serviceId: string,
) => {
    try {
        const service = await getServiceData(serviceId);
        const phone = interaction.fields.getTextInputValue("phone");
        if (service?.integrationType === "tagMango") {
            const userId = await gangstaPhilosophy.subscriberValidator(
                serviceId,
                +phone
            );
            if (userId) {
                const otp = generateOtpForDiscordId(interaction.user.id, userId);
                await sendOtp(parseInt(phone), otp);

                const verifyButton = new ButtonBuilder()
                    .setCustomId(
                        `authifyButton-verifyPhone-${phone}-${serviceId}`,
                    )
                    .setLabel("Verify OTP")
                    .setStyle(ButtonStyle.Success);

                const actionRow =
                    new ActionRowBuilder<ButtonBuilder>().addComponents(
                        verifyButton,
                    );

                await interaction.reply({
                    content: "An OTP has been sent to your phone number.",
                    ephemeral: true,
                    components: [actionRow],
                });
                return;
            }
            await interaction.reply({
                content:
                    "We couldnt verify your phone number.Please try again or reach out to the support channel.",
                ephemeral: true,
            });
        } else {
            const { phoneNumbers, discordIds } =
                await getColumnDataofService(serviceId);
            const existing = discordIds.find((id, i) => {
                if (phoneNumbers[i] === phone) {
                    return false;
                }
                return id === interaction.user.id;
            });
            if (existing) {
                await interaction.reply({
                    content: "You have already registered.",
                    ephemeral: true,
                });
                return;
            }
            if (!phoneNumbers.includes(phone)) {
                await interaction.reply({
                    content:
                        "Phone number not found in course. Please contact the course admin.",
                    ephemeral: true,
                });
                return;
            }

            const existingDiscordId = discordIds[phoneNumbers.indexOf(phone)];
            if (
                existingDiscordId &&
                existingDiscordId !== interaction.user.id
            ) {
                await interaction.reply({
                    content: `Phone number already registered with <@${existingDiscordId}>.`,
                    ephemeral: true,
                });
                return;
            }
            const otp = generateOtpForDiscordId(interaction.user.id);
            await sendOtp(parseInt(phone), otp);

            const verifyButton = new ButtonBuilder()
                .setCustomId(`authifyButton-verifyPhone-${phone}-${serviceId}`)
                .setLabel("Verify OTP")
                .setStyle(ButtonStyle.Success);

            const actionRow =
                new ActionRowBuilder<ButtonBuilder>().addComponents(
                    verifyButton,
                );

            await interaction.reply({
                content: "An OTP has been sent to your phone number.",
                ephemeral: true,
                components: [actionRow],
            });
        }
    } catch (error: any) {
        console.log(error);
        if (error.message === "Fast2SMS API error.") {
            await interaction.reply({
                content:
                    "An error occurred while sending OTP. Please try again.",
                ephemeral: true,
            });
            return;
        }
        await interaction.reply({
            content: "An error occurred. Please try again.",
            ephemeral: true,
        });
    }
};
