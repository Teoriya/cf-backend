import { GuildMemberRoleManager, ModalSubmitInteraction } from "discord.js";
import {
    fetchRoles,
    updateDiscordIdForPhoneNumberandFetchRoles,
} from "../../../services/service.service";
import { verifyOtpForDiscordId } from "../../../utils/otp.utils";
import customSolution from "../../../customSolutions/gangstaPhilosophy";

export default async (
    interaction: ModalSubmitInteraction,
    serviceId: string,
    phone: string,
) => {
    try {
        await interaction.reply({
            content: "Verifying OTP...",
            ephemeral: true,
        });
        const otp = parseInt(interaction.fields.getTextInputValue("otp"));
        const validOtp = verifyOtpForDiscordId(interaction.user.id, otp);
        if (!validOtp) {
            await interaction.editReply({
                content: "Invalid OTP. Please try again.",
            });
            return;
        }

        await interaction.editReply({
            content: "OTP validated , assigning roles ...",
        });
        let roles = [];
        if (validOtp.userId) {
            customSolution.linkDiscord(validOtp.userId, interaction.user.id);
            roles = (await fetchRoles(serviceId)) || [];
        } else {
            roles = await updateDiscordIdForPhoneNumberandFetchRoles(
                serviceId,
                phone,
                interaction.user.id,
            );
        }
        if (!roles || roles.length === 0) {
            await interaction.editReply({
                content: "No roles found for this service.",
            });
            return;
        }
        if (
            !interaction.member ||
            !(interaction.member.roles instanceof GuildMemberRoleManager)
        )
            throw new Error("Member not found");

        await interaction.member.roles.add(roles);
        await interaction.editReply({
            content: "Roles assigned successfully.",
        });
    } catch (error: any) {
        console.log(error);
    }
};
