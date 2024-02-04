import mongoose from "mongoose";
import { CustomerDocument } from "@/models/mongoDB/customer.model";
import { ServiceDocument } from "@/models/mongoDB/service.model";

export type TmCredentialDocument = mongoose.Document & {
    customer: mongoose.PopulatedDoc<CustomerDocument & mongoose.Document>;
    accessToken: string; // 1.5 hours
    refreshToken: string; // 1 month
    phone: number;
    domain: string;
    service: mongoose.PopulatedDoc<ServiceDocument & mongoose.Document>;
    createdAt: Date;
    updatedAt: Date;
};

const TmCredentialSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "customer",
            required: true,
        },
        accessToken: { type: String, required: true },
        refreshToken: { type: String, required: true },
        phone: { type: Number, required: true },
        domain: { type: String, required: true },
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "service",
            required: true,
        },
    },
    { timestamps: true },
);
const model = mongoose.model<TmCredentialDocument>(
    "tmCredential",
    TmCredentialSchema,
);
export default model;
