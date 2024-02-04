import mongoose from "mongoose";

export type TmSubscriberDocument = mongoose.Document & {
    discordId: string;
    tmId: string;
    email: string;
    phone: number;
    name: string;
    country: string;
    linkedDiscord: boolean;
    discordLinkTimestamp: Date;
    updatedAt: Date;
    createdAt: Date;
};

const TmSubscriberSchema = new mongoose.Schema(
    {
        discordId: { type: String, unique: true, sparse: true },
        tmId: { type: String, required: true, unique: true }, // fanId
        email: { type: String, required: true, unique: true }, // fanEmail
        phone: { type: Number, required: true, unique: true }, // fanPhone
        name: { type: String, required: true }, // fanName
        country: { type: String, required: true }, // fanCountry
        linkedDiscord: { type: Boolean, required: true, default: false },
        discordLinkTimestamp: { type: Date, default: null },
    },
    { timestamps: true },
);

export default mongoose.model<TmSubscriberDocument>(
    "attackMode",
    TmSubscriberSchema,
);
