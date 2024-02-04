import { getSubscribers } from "../customIntegrations/tagMango/apiWrapper";
import router from "../customIntegrations/tagMango/routes";
import { CustomSolution } from "../types";
import { getMapper } from "../customIntegrations/tagMango/services/tmMapper.service";
import {
    addOrUpdateMultipleSubscribers,
    addOrUpdateSubscriber,
    getSubscriber,
} from "../customIntegrations/tagMango/services/attackMode.service";
import { DiscordError } from "@/types/error";
import attackModeModel from "../customIntegrations/tagMango/models/attackMode.model";
import cron from "node-cron";

router.get("/", async (req, res) => {
    res.send("Welcome to Gangsta Philosophy!");
});

const subscriberValidator = async (
    serviceId: string,
    term: string | number,
    discordId: string,
) => {
    const mangoData = await getMapper({ serviceId });
    if (!mangoData) throw new DiscordError("Mango not found", false);
    const mangoes = mangoData.mango;

    // schedule cron job to update db every 24 hours
    cron.schedule("0 0 12 * * *", () => {
        // "seconds minutes hours dayOfMonth month dayOfWeek"
        console.log("Running cron job to update attack mode users db!");
        updateAttackModeUsersDB(mangoes, serviceId);
    });

    // check term type using regex: email or phone
    const emailRegex = /\S+@\S+\.\S+/;

    // check if term is email or phone
    const isEmail = emailRegex.test(term as string);

    // check if subscriber exists in db
    let dbSubscriber;
    if (isEmail) {
        dbSubscriber = await getSubscriber({ email: term as string });
    } else {
        const phone = parseInt(term as string);
        if (Number.isNaN(phone))
            throw new DiscordError("Invalid phone number!", true);
        dbSubscriber = await getSubscriber({
            phone: term as unknown as number,
        });
    }

    if (!dbSubscriber) {
        // Fetching from tagMango for new subscriber
        let subscriber = await getSubscribers({
            type: "active",
            term,
            mangoes,
            serviceId,
        });

        // if subscriber doesn't exist, return false
        if (subscriber.subscribers.length === 0) return false;

        // check if subscriber is an array of length 1
        if (subscriber.subscribers.length > 1)
            throw new DiscordError(
                "Multiple subscribers found, for the same mango and term!",
                false,
            );

        subscriber = subscriber.subscribers[0]._id;

        const newSubscriber = {
            tmId: subscriber.fanId,
            email: subscriber.fanEmail,
            phone: subscriber.fanPhone,
            name: subscriber.name,
            country: subscriber.fanCountry,
        };
        const data = await addOrUpdateSubscriber(newSubscriber);
        if (!data) throw new DiscordError("Failed to add subscriber!", false);

        // update data function
        refetchData(mangoes, serviceId);

        return subscriber.fanId;
    }

    // if subscriber exists, check if discordId is already linked
    if (dbSubscriber.discordId && dbSubscriber.discordId !== discordId)
        throw new DiscordError(
            "Subscriber already linked to another Discord Account! Contact admin for support.",
            true,
        );

    // update data function
    refetchData(mangoes, serviceId);

    return dbSubscriber.tmId;
};

const linkDiscord = async (fanId: string, discordId: string) => {
    const dbSubscriber = await getSubscriber({ tmId: fanId });
    if (!dbSubscriber) {
        throw new DiscordError(
            "Subscriber not found, please validate subscriber first!",
            false,
        );
    }
    const updateSubscriber = {
        tmId: dbSubscriber.tmId,
        discordId,
        discordLinkTimestamp: new Date(),
        linkedDiscord: true,
    };
    const data = await addOrUpdateSubscriber(updateSubscriber);
    if (!data)
        throw new DiscordError(
            "Failed to update subscriber with discord id!",
            false,
        );
    return true;
};

export default (<CustomSolution>{
    id: "gangstaPhilosophy",
    router,
    config: {
        isEmailVerificationEnabled: true,
        isPhoneVerificationEnabled: true,
        isDiscordOauthEnabled: false,
    },
    subscriberValidator,
    linkDiscord,
});

export const refetchData = async (mangoes: string, serviceId: string) => {
    try {
        // check last fetch updated time
        // const lastFetch = await attackModeModel
        //     .findOne()
        //     .sort({ updatedAt: -1 })
        //     .select("updatedAt -_id");

        // check last 2nd fetch updated time
        const lastFetch = await attackModeModel
            .findOne()
            .sort({ updatedAt: -1 })
            .select("updatedAt -_id")
            .skip(1);

        console.log({ lastFetch });

        if (!lastFetch)
            throw new DiscordError("Failed to fetch last updated time!", false);

        // check if updatedAt is greater than 1 hour, fetch from tagMango
        if (lastFetch.updatedAt.getTime() + 60 * 60 * 1000 < Date.now())
            updateAttackModeUsersDB(mangoes, serviceId);
    } catch (error) {
        console.log(error);
    }
};

export const updateAttackModeUsersDB = async (
    mangoes: string,
    serviceId: string,
) => {
    // may burst on user count > 13000
    try {
        const startTime = new Date();
        console.log({ startTime });

        const subscribers = await getSubscribers({
            type: "active",
            mangoes,
            serviceId,
        });

        const subscriberData = subscribers.subscribers.map(
            (subscriber: {
                _id: {
                    fanId: string;
                    fanEmail: string;
                    fanPhone: string;
                    name: string;
                    fanCountry: string;
                };
            }) => {
                return {
                    tmId: subscriber._id.fanId,
                    email: subscriber._id.fanEmail,
                    phone: subscriber._id.fanPhone,
                    name: subscriber._id.name,
                    country: subscriber._id.fanCountry,
                };
            },
        );
        console.log({
            fetchTime: new Date().getTime() - startTime.getTime(),
        });
        const data = await addOrUpdateMultipleSubscribers(subscriberData);
        if (!data) throw new DiscordError("Failed to add subscriber!", false);
        const endTime = new Date();
        console.log({ endTime });
        console.log({ diff: endTime.getTime() - startTime.getTime() });
    } catch (error) {
        console.log(error);
    }
};
