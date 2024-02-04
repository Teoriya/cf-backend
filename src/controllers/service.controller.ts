import { Request, Response } from "express";
import { TypedRequestBody, TypedRequestQuery } from "zod-express-middleware";
import {
    createServiceValidator,
    createTMServiceValidator,
    guildIdValidator,
} from "@/inputValidators/service.validators";
import {
    getNumberOfServicesInDiscordGuild,
    getServicesOfDiscordGuilds,
    createService,
    getServiceData,
    createTMService,
} from "@/services/service.service";
import {
    deployCommandsToGuild,
    isAdmin,
    verifyGuild,
} from "@/utils/discord.utils";
import { generateBotInviteLink, getGuilds } from "@/utils/oauth.utils";
import { getSpreadsheetDataFromServiceId } from "@/services/spreadsheet.service";
import { ApiHandler } from "@/utils/api-handler.util";

export const getServicesController = ApiHandler(
    async (req: Request, res: Response) => {
        const guilds = await getGuilds(req.customer.accessToken);
        if (!guilds) throw new Error("Error fetching guilds");
        const guildIds = [];
        for (const guild of guilds) {
            if (guild.permissions && isAdmin(guild.permissions)) {
                guildIds.push(guild.id);
            }
        }
        const services = await getServicesOfDiscordGuilds(guildIds);
        const servicesWithGuilds = services.map((service) => {
            const guild = guilds.find((guild) => guild.id === service.guildId);
            if (!guild) throw new Error("Guild not found");
            return {
                ...service,
                guild: {
                    ...guild,
                    icon: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp`,
                },
            };
        });
        return res.send({
            data: servicesWithGuilds,
            message: "Services fetched successfully",
            success: true,
        });
    },
);

export const getServiceDataController = ApiHandler(
    async (req: Request, res: Response) => {
        // serviceID -> serviceData. populate(creator) -> integrationType // 1st method implemented
        const service = await getServiceData(req.params.serviceId);
        // integrationType -> sheets -> sheetData-> sheetsData // 1st method --> populate(service) by taking integrationType in Request --> 2nd method
        if (!service) throw new Error("Service not found");
        if (service.integrationType === "sheets") {
            const sheetData = await getSpreadsheetDataFromServiceId(
                service._id,
            );
            if (!sheetData) throw new Error("Sheet not found");

            const guilds = await getGuilds(req.customer.accessToken);
            if (!guilds) throw new Error("Error fetching guilds");

            const guild = guilds.find((guild) => guild.id === service.guildId);
            if (!guild) throw new Error("Guild not found");

            return res.send({
                data: {
                    sheet: sheetData,
                    guild,
                },
                message: "Service fetched successfully",
                success: true,
            });
        }
        if (service.integrationType === "tagMango") {
            return res.send({
                message: "TagMango integration is not supported yet",
                success: false,
            });
        }
        return res.send({
            message: "Invalid integration type",
            success: false,
        });
    },
);

export const getGuildsOfUserController = ApiHandler(
    async (req: Request, res: Response) => {
        const guilds = await getGuilds(req.customer.accessToken);
        const respponseData = guilds.map((guild) => {
            return {
                id: guild.id,
                name: guild.name,
                icon: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp`,
                isAdmin: guild.permissions && isAdmin(guild.permissions),
            };
        });
        res.send({
            data: respponseData,
            message: "Guilds fetched successfully",
            success: true,
        });
    },
);

export const generateBotInviteLinkController = ApiHandler(async (
    req: TypedRequestQuery<typeof guildIdValidator.query>,
    res: Response,
) => {
        const url = generateBotInviteLink(req.query.guildId);
        res.send({
            data: url,
            message: "Bot invite link generated successfully",
            success: true,
        });
});

export const verifyBotInGuildController = ApiHandler(
    async (
        req: TypedRequestQuery<typeof guildIdValidator.query>,
        res: Response,
    ) => {
        const isAdded = await verifyGuild(req.query.guildId);
        res.send({
            data: { isAdded },
            message: "Bot status sent.",
            success: true,
        });
    },
);

export const createServiceController = ApiHandler(async (
    req: TypedRequestBody<typeof createServiceValidator.body>,
    res: Response,
) => {
        const numberOfExistingServices =
            await getNumberOfServicesInDiscordGuild(req.body.guildId);
        if (numberOfExistingServices >= 1)
            throw new Error("You can only have one service per guild");

        const phoneNumberRow = req.body.phoneCell.match(/\d+/g)?.[0] as string;
        const phoneNumberColumn = req.body.phoneCell.match(
            /[A-Z]+/g,
        )?.[0] as string;
        const emailRow = req.body.emailCell.match(/\d+/g)?.[0];
        const emailColumn = req.body.emailCell.match(/[A-Z]+/g)?.[0] as string;
        const discordIdRow = req.body.discordIdCell.match(/\d+/g)?.[0];
        const discordIdColumn = req.body.discordIdCell.match(
            /[A-Z]+/g,
        )?.[0] as string;
        if (phoneNumberRow !== emailRow || phoneNumberRow !== discordIdRow)
            throw new Error("All the cells should be in the same row");

        const service = await createService(
            req.body.name,
            phoneNumberColumn,
            emailColumn,
            discordIdColumn,
            parseInt(phoneNumberRow),
            req.body.sheetName,
            req.body.spreadSheetUrl,
            req.body.sheetId,
            req.body.guildId,
            req.customer.id,
            req.body.roleIds,
        );

        await deployCommandsToGuild(req.body.guildId);

        return res.status(200).json({
            data: service,
            message: "Service created successfully",
            success: true,
        });

});

export const createTMServiceController = ApiHandler(async (
    req: TypedRequestBody<typeof createTMServiceValidator.body>,
    res: Response,
) => {
        // const numberOfExistingServices =
        //     await getNumberOfServicesInDiscordGuild(req.body.guildId);
        // if (numberOfExistingServices >= 1)
        //     throw new Error("You can only have one service per guild");

        // ToDO: Authentication for TM Service Creation for subscribed users only

        const service = await createTMService(
            req.body.name,
            req.body.guildId,
            req.customer.id,
            req.body.roleIds,
        );

        await deployCommandsToGuild(req.body.guildId);

        res.send({
            data: service,
            message: "Service created successfully",
            success: true,
        });
});
