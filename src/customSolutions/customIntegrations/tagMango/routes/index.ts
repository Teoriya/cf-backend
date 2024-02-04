import serviceModel from "@/models/mongoDB/service.model";
import { Router } from "express";
import { getAllActiveMangoes, getOtp, verifyOtp } from "../apiWrapper";
import { getCredential } from "../services/tmCredential.service";
import { createMapper } from "../services/tmMapper.service";
const router = Router();

// Get OTP
router.post("/getOtp", async (req, res) => {
    try {
        const { phone, domain } = req.body;
        const data = {
            phone,
            userAgent: req.headers["user-agent"] || "",
        };
        const result = await getOtp(data, domain);
        if (result.code === 0 && result.type === "OK") {
            res.status(200).send({
                message: "OTP sent successfully",
                data: result,
            });
        } else {
            res.status(500).send({
                message: "Error in sending OTP",
                error: result,
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error in sending OTP",
            error,
        });
    }
});

// Verify OTP
router.post("/verifyOtp", async (req, res) => {
    try {
        const { phone, otp, domain, serviceId } = req.body;
        const data = {
            phone,
            otp,
            userAgent: req.headers["user-agent"] || "",
        };
        const verified = await verifyOtp(
            data,
            req.customer.id,
            domain,
            serviceId,
        );
        if (verified) {
            res.status(200).send({
                message: "OTP verified successfully",
            });
        } else {
            res.status(500).send({
                message: "Error in verifying OTP",
            });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error in verifying OTP",
            data: error,
        });
    }
});

router.get("/mangoes", async (req, res) => {
    try {
        if (!req.query.serviceId) throw new Error("ServiceId not found");
        const credential = await getCredential(req.query.serviceId as string);
        if (!credential) throw new Error("Credential not found");
        const mangoes = await getAllActiveMangoes(
            req.query.serviceId as string,
        );
        if (!mangoes) throw new Error("No mangoes found");

        const data = mangoes.map((mango: any) => {
            return {
                _id: mango._id,
                title: mango.title,
            };
        });

        res.status(200).send({
            message: "Mangoes fetched successfully",
            data,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send({
            message: "Error in fetching mangoes",
            data: error,
        });
    }
});

// TODO: Add validation for mango
router.post("/addCustomSolution", async (req, res) => {
    try {
        const { mango, serviceId } = req.body;
        if (!mango) throw new Error("Mango not found");
        if (!serviceId) throw new Error("ServiceId not found");

        const service = await serviceModel.findById(serviceId).exec();
        if (!service) throw new Error("Service not found");

        const mangoes = await getAllActiveMangoes(serviceId);
        if (!mangoes.find((m: any) => m._id === mango))
            throw new Error("Mango not found in TagMango");

        const mapper = await createMapper({
            mango,
            serviceId,
            customerId: req.customer.id,
            tmCredentialId: (await getCredential(serviceId))?._id,
            metadata: {},
            customIntegrationId: service.customIntegrationId,
        });
        if (!mapper) throw new Error("Error in creating mapper");

        return res.status(200).send({
            message: "Custom TagMango Service created successfully",
        });
    } catch (error: any) {
        if (error.name === "MongoServerError") {
            if (error.code === 11000) {
                return res.status(400).send({
                    message: "Service already exists!",
                    data: error.keyValue,
                });
            }
        }
        return res.status(500).send({
            message: "Error in creating custom TagMango Service",
            data: error,
        });
    }
});

export default router;
