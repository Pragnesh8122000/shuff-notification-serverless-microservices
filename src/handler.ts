import { DBClient } from "./config/databaseClient.js";

(async function connectDb() {
  try {
    await DBClient();
  } catch (error) {
    console.log(error)
  }
})();

export * from "./web/handlers/notificationHandler.js";
export * from "./web/handlers/emailHandler.js";
export * from "./web/handlers/smsHandler.js";