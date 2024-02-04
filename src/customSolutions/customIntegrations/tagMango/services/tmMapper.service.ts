import tmMapper from "../models/tmMapper.model";

export const createMapper = async ({
    mango,
    serviceId,
    tmCredentialId,
    customerId,
    metadata,
    customIntegrationId,
}: {
    mango: string;
    serviceId: string;
    tmCredentialId: string;
    customerId: string;
    metadata: object;
    customIntegrationId: string;
}) => {
    const mapper = await tmMapper.findOneAndUpdate(
        { service: serviceId },
        {
            mango,
            tmCredential: tmCredentialId,
            customer: customerId,
            metadata,
            customIntegrationId,
        },
        { upsert: true, new: true },
    );
    return mapper;
};

export const getMapper = async (
    {
        mango,
        serviceId,
        customerId,
    }: {
        mango?: string;
        serviceId?: string;
        customerId?: string;
    },
    populated = false,
) => {
    const mapper = await tmMapper
        .findOne({
            ...(mango && { mango }),
            ...(serviceId && { service: serviceId }),
            ...(customerId && { customer: customerId }),
        })
        .populate(populated ? ["service", "tmCredential", "customer"] : [])
        .lean()
        .exec();

    return mapper;
};
