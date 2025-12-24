import { db } from "~/server/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { env } from "~/env";
import { Polar } from "@polar-sh/sdk";
import { polar, checkout, portal, webhooks } from "@polar-sh/better-auth";

const polarClient = new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    // Use 'sandbox' if you're using the Polar Sandbox environment
    // Remember that access tokens, products, etc. are completely separated between environments.
    // Access tokens obtained in Production are for instance not usable in the Sandbox environment.
    server: 'sandbox'
});
export const auth = betterAuth({
    database: prismaAdapter(db,{
        provider: "postgresql"
    }),
    emailAndPassword: {
        enabled: true,
    },
     plugins: [
        polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
                checkout({
                    products: [
                        {
                            productId: "b6519d4d-ed40-4e55-ba9e-2ea5fb9c83de", // ID of Product from Polar Dashboard
                            slug: "small" // Custom slug for easy reference in Checkout URL, e.g. /checkout/pro
                        },
                        {
                            productId: "94958c81-19de-4b0b-b239-1e3964921feb",
                            slug: "medium"
                        },
                        {
                            productId: "91bdbd25-9a70-497e-83cc-fe2defc02b8a",
                            slug: "large"
                        }
                    ],
                    successUrl: "/",
                    authenticatedUsersOnly: true
                }),
                portal(),
                webhooks({
                    secret: env.POLAR_WEBHOOK_SECRET,
                    onOrderPaid: async (order) => {
                        const externalCustomerId = order.data.customer.externalId;
                        if (!externalCustomerId) {
                            console.error("Order paid webhook received but customer has no external ID. Cannot link subscription to user.");
                            throw new Error("Customer has no external ID");
                        }

                        const productId = order.data.productId;
                        if (!productId) {
                            console.error("Order paid webhook received but no product ID found in order items.");
                            throw new Error("No product ID found in order items");
                        }

                        let creditsToAdd = 0;

                        switch (productId) {
                            case "b6519d4d-ed40-4e55-ba9e-2ea5fb9c83de": // small
                                creditsToAdd = 10;
                                break;
                            case "94958c81-19de-4b0b-b239-1e3964921feb": // medium
                                creditsToAdd = 25;
                                break;
                            case "91bdbd25-9a70-497e-83cc-fe2defc02b8a": // large
                                creditsToAdd = 50;
                                break;
                            default:
                                console.error(`Unknown product ID: ${productId}`);
                                throw new Error("Unknown product ID");
                        }

                        await db.user.update({
                            where: { id: externalCustomerId },
                            data: {
                                credits: {
                                    increment: creditsToAdd
                                }
                            }
                        })
                    }
                })
            ],
        })
    ]
})