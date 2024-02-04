import tmCredential from "../models/tmCredential.model";

export const createCredential = async ({
    customerId,
    accessToken,
    refreshToken,
    phone,
    domain,
    serviceId,
}: {
    customerId?: string;
    accessToken: string;
    refreshToken: string;
    phone: number;
    domain: string;
    serviceId: string;
}) => {
    const credential = await tmCredential
        .updateOne(
            { service: serviceId },
            { accessToken, refreshToken, phone, domain, customer: customerId },
            { upsert: true },
        )
        .exec();
    return credential;
};

export const getCredential = async (serviceId: string) => {
    const credential = await tmCredential
        .findOne({ service: serviceId })
        .exec();
    return credential;
};
