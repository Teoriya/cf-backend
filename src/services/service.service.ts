import { sheetRegex } from "../inputValidators/sheet.validators";
import serviceModel from "../models/mongoDB/service.model";
import { editCell, getColumnData } from "../utils/sheet.utils";
import {
    createSpreadsheet,
    getSpreadsheetDataFromServiceId,
} from "./spreadsheet.service";

export const getNumberOfServicesInDiscordGuild = async (guildId: string) => {
    const numberOfServices = await serviceModel
        .countDocuments({ guildId })
        .exec();
    return numberOfServices;
};

export const getServicesOfDiscordGuilds = async (guildIds: string[]) => {
    const services = await serviceModel
        .find({ guildId: { $in: guildIds } })
        .lean()
        .exec();
    return services;
};

export const getServicesOfDiscordGuild = async (guildId: string) => {
    const services = await serviceModel.find({ guildId }).exec();
    return services;
};

export const getServiceData = async (serviceId: string) => {
    const service = await serviceModel
        .findById(serviceId)
        .populate("creator")
        .exec();
    return service;
};

export const createTMService = async (
    name: string,
    guildId: string,
    creatorId: string,
    roles: string[],
) => {
    const service = await serviceModel.create({
        name,
        guildId,
        creator: creatorId,
        roles,
        isCustom: true,
        integrationType: "tagMango",
    });
    if (!service) {
        throw new Error("Error creating service");
    }
    return service;
};

export const createService = async (
    name: string,
    phoneNumberColumn: string,
    emailColumn: string,
    discordIdColumn: string,
    headerRow: number,
    sheetName: string,
    spreadsheetUrl: string,
    sheetId: number,
    guildId: string,
    creatorId: string,
    roles: string[],
) => {
    const spreadsheetId = spreadsheetUrl.match(sheetRegex)?.[1] as string;
    const service = await serviceModel.create({
        name,
        guildId,
        creator: creatorId,
        roles,
        integrationType: "sheets",
    });
    if (!service) {
        throw new Error("Error creating service");
    }
    const spreadsheet = await createSpreadsheet({
        service: service._id,
        phoneNumberColumn,
        emailColumn,
        discordIdColumn,
        headerRow,
        sheetName,
        spreadsheetUrl,
        spreadsheetId,
        sheetId,
        guildId,
    });
    if (!spreadsheet) {
        const deletedService = await serviceModel
            .findByIdAndDelete(service._id)
            .exec();
        console.log("deletedService", deletedService);
        throw new Error("Error creating spreadsheet");
    }
    return service;
};

export const columnDataValuesToPhoneNumber = (
    phoneNumberDataValues: string[][],
) => {
    return (
        phoneNumberDataValues?.map((row) => {
            if (!row[0]) return null;
            const num = row[0].replace(/\D/g, "");
            if (num.length === 10) return num as string;
            if (num.length === 12 && num.startsWith("91"))
                return num.slice(2) as string;
            return null;
        }) || []
    );
};

export const getColumnDataofService = async (serviceId: string) => {
    const spreadsheet = await getSpreadsheetDataFromServiceId(serviceId);
    if (
        !spreadsheet ||
        !spreadsheet.spreadsheetId ||
        !spreadsheet.sheetName ||
        !spreadsheet.phoneNumberColumn
    )
        throw new Error("Spreadsheet is invalid");
    const phoneNumberColumn = spreadsheet.phoneNumberColumn;
    const discordIdColumn = spreadsheet.discordIdColumn;
    // const emailColumn = spreadsheet.emailColumn;

    const [phoneNumberData, discordIdData] = await Promise.all([
        getColumnData(
            spreadsheet.spreadsheetId,
            spreadsheet.sheetName,
            phoneNumberColumn,
        ),
        getColumnData(
            spreadsheet.spreadsheetId,
            spreadsheet.sheetName,
            discordIdColumn,
        ),
        // getColumnData(
        // 	spreadsheet.spreadsheetId,
        // 	spreadsheet.sheetName,
        // 	emailColumn,
        // ),
    ]);

    const discordIds =
        discordIdData.values?.map((row) => row[0] as string) || [];

    if (!phoneNumberData.values) return { phoneNumbers: [], discordIds };

    const phoneNumbers = columnDataValuesToPhoneNumber(phoneNumberData.values);
    return { phoneNumbers, discordIds };
};

export const updateDiscordIdForPhoneNumberandFetchRoles = async (
    serviceId: string,
    phoneNumber: string,
    discordId: string,
) => {
    const spreadsheet = await getSpreadsheetDataFromServiceId(serviceId);
    if (
        !spreadsheet ||
        !spreadsheet.spreadsheetId ||
        !spreadsheet.sheetName ||
        !spreadsheet.phoneNumberColumn ||
        !spreadsheet.discordIdColumn
    )
        throw new Error("Spreadsheet is invalid");
    const phoneNumberData = await getColumnData(
        spreadsheet.spreadsheetId,
        spreadsheet.sheetName,
        spreadsheet.phoneNumberColumn,
    );
    if (!phoneNumberData.values) throw new Error("No phone data in sheet.");
    const phoneNumbers = columnDataValuesToPhoneNumber(phoneNumberData.values);
    const rowNumber = phoneNumbers.indexOf(phoneNumber);
    if (rowNumber === -1) throw new Error("Phone Number not in sheet");

    await editCell(
        spreadsheet.spreadsheetId,
        spreadsheet.sheetName,
        `${spreadsheet.discordIdColumn}${rowNumber + 1}`,
        discordId,
    );
    return spreadsheet.service.roles;
};

export const fetchRoles = async (serviceId: string) => {
    return (await serviceModel.findById(serviceId).exec())?.roles;
};
