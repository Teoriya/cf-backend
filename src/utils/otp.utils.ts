import crypto from "crypto";
import axios from "axios";
import { Collection } from "discord.js";
import { Fast2SMS_API_KEY, OTP_EXPIRY_TIME, OTP_SECRET } from "../config";

interface OtpData {
    otp: number;
    userId?: string;
}

const otpCollection = new Collection<string, OtpData>();

/**
 * @returns a 6 digit OTP
 * @description Generates a 6 digit OTP.S
 */
export const generateOtp = () => {
    const otp = crypto.randomInt(100000, 999999);
    return otp;
};

export const generateOtpForDiscordId = (discordId: string, userId?: string) => {
    const existing = otpCollection.get(discordId);
    if (existing) return existing;
    const otp = generateOtp();
    otpCollection.set(discordId, { otp, userId } as OtpData);
    setTimeout(() => {
        otpCollection.delete(discordId);
    }, OTP_EXPIRY_TIME);
    return otp;
};

export const verifyOtpForDiscordId = (discordId: string, otp: number) => {
    const existing = otpCollection.get(discordId);
    if (existing?.otp === otp) otpCollection.delete(discordId);
    return existing;
};

/**
 *
 * @param phone the phone number to generate the OTP hash for
 * @param otp the OTP to generate the OTP hash for
 * @param expiresAt the time the OTP expires
 * @returns a hash of the OTP
 * @description Generates a hash of the OTP using the OTP_SECRET config variable.
 */
export const generateOtpHash = (
    phone: number,
    otp: number,
    expiresAt: number,
) => {
    const otpHash = crypto
        .createHmac("sha256", OTP_SECRET)
        .update(`${phone}-${otp}-${expiresAt}`)
        .digest("hex");
    return otpHash;
};

/**
 *
 * @param phone the phone number to send the OTP to
 * @param otp the OTP to send
 * @returns void
 * @description Sends the OTP to the given phone number using the Fast2SMS API.
 * @throws {Error}
 */
export const sendOtp = async (phone: number, otp: unknown): Promise<void> => {
    try {
        const response = await axios.get(
            "https://www.fast2sms.com/dev/bulkV2",
            {
                params: {
                    authorization: Fast2SMS_API_KEY,
                    route: "otp",
                    numbers: phone,
                    variables_values: otp,
                    flash: "0",
                },
            },
        );
        if (response.data.return === false)
            throw new Error(response.data.message[0] || "Fast2SMS API error.");
    } catch (error: any) {
        console.log({ "Fast2SMS API error": error });
        throw new Error("Fast2SMS API error.");
    }
};
