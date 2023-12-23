import mongoose from "mongoose";
import { CustomerDocument } from "./customer.model";
// import { SpreadsheetDocument } from "./spreadsheet.models";

export type ServiceDocument = mongoose.Document & {
  guildId: string;
  creator: mongoose.PopulatedDoc<CustomerDocument & mongoose.Document>;
  // spreadsheet: mongoose.PopulatedDoc<SpreadsheetDocument & mongoose.Document>;
  roles: string[];
  isCustom: boolean;
  customIntegrationId: string;
  integrationType: "tagMango" | "sheets";
  status: "active" | "inactive" | "paymentPending";
};

const ServiceSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true },
    spreadsheet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "spreadsheet",
      unique: true,
      sparse: true,
    }, // already in spreadsheet model, not required here
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "customer",
    },
    roles: [{ type: String, default: [] }],
    integrationType: {
      type: String,
      enum: ["tagMango", "sheets"],
      default: "sheets",
    },
    customIntegrationId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "paymentPending"],
      default: "inactive",
    },
  },
  { timestamps: true },
);

export default mongoose.model<ServiceDocument>("service", ServiceSchema);
