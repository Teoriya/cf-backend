// mango, service, credential, customer
import mongoose from "mongoose";
import { CustomerDocument } from "@/models/mongoDB/customer.model";
import { ServiceDocument } from "@/models/mongoDB/service.model";
import { TmCredentialDocument } from "./tmCredential.model";

export type TmMapperDocument = mongoose.Document & {
    mango: string;
    service: mongoose.PopulatedDoc<ServiceDocument & mongoose.Document>;
    tmCredential: mongoose.PopulatedDoc<
        TmCredentialDocument & mongoose.Document
    >;
    customer: mongoose.PopulatedDoc<CustomerDocument & mongoose.Document>;
    metadata: object;
    customIntegrationId: string;
};

const TmMapperSchema = new mongoose.Schema(
    {
        mango: { type: String, required: true, unique: true },
        service: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "service",
            unique: true,
        },
        tmCredential: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "tmCredential",
        },
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "customer",
        },
        metadata: { type: Object },
        customIntegrationId: { type: String, required: true },
    },
    { timestamps: true },
);
const model = mongoose.model<TmMapperDocument>("tmMapper", TmMapperSchema);
export default model;
