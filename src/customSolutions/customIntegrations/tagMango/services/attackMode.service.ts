import attackModeModel from "../models/attackMode.model";

interface AttackModeSubscriber {
    discordId: string;
    tmId: string;
    email: string;
    phone: number;
    name: string;
    country: string;
    linkedDiscord: boolean;
    discordLinkTimestamp: Date;
}

export const addOrUpdateSubscriber = async (
    data: Partial<AttackModeSubscriber>,
) => {
    const subscriber = attackModeModel.findOneAndUpdate(
        { tmId: data.tmId },
        data,
        { upsert: true, new: true },
    );
    return subscriber;
};

export const addOrUpdateMultipleSubscribers = async (
    data: Partial<AttackModeSubscriber>[],
) => {
    const subscribers = attackModeModel.bulkWrite(
        data.map((subscriber) => ({
            updateOne: {
                filter: { tmId: subscriber.tmId },
                update: subscriber,
                upsert: true,
            },
        })),
    );
    return subscribers;
};

export const getSubscriberByTmId = async (tmId: string) => {
    const subscriber = attackModeModel.findOne({ tmId });
    return subscriber;
};

export const getAllSubscribers = async () => {
    const subscribers = attackModeModel.find({});
    return subscribers;
};

export const getSubscriberByDiscordId = async (discordId: string) => {
    const subscriber = attackModeModel.findOne({ discordId });
    return subscriber;
};

export const getSubscriberByPhone = async (phone: number) => {
    const subscriber = attackModeModel.findOne({ phone });
    return subscriber;
};

export const getSubscriberByEmail = async (email: string) => {
    const subscriber = attackModeModel.findOne({ email });
    return subscriber;
};

export const getSubscriber = async (query: {
    discordId?: string;
    tmId?: string;
    email?: string;
    phone?: number;
}) => {
    const subscriber = attackModeModel.findOne(query);
    return subscriber;
};
