import { promises as fs } from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";

import { getEnv } from "../loadEnv";
import { connectToDB, connectWithDatabase } from "./dbConnect";
import { FastifyInstance } from "fastify";
import { createCustomError } from "../error/customError";
import { StatusCodes } from "http-status-codes";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_TABLES_LIST_DEFAULT = "wallets,transactions";
const DB_TRIGGERS_LIST_DEFAULT = "trigger_notification,trigger_tx_table";

export const checkTablesExistence = async (
  server: FastifyInstance,
): Promise<void> => {
  try {
    // Connect to the DB
    const knex = await connectToDB(server);

    // Check if the tables Exists
    const tablesList: string[] = getEnv(
      "DB_TABLES_LIST",
      DB_TABLES_LIST_DEFAULT,
    )
      .split(",")
      .map(function (item: any) {
        return item.trim();
      });

    if (!tablesList) {
      const error = createCustomError(
        "DB_TABLES_LIST ENV variable is empty",
        StatusCodes.NOT_FOUND,
        "DB_TABLES_LIST_NOT_FOUND",
      );
      throw error;
    }

    for (const tableName of tablesList) {
      const schemaSQL = await fs.readFile(
        `${__dirname}/sql-schemas/${tableName}.sql`,
        "utf-8",
      );
      // Create Table using schema
      await knex.schema.raw(schemaSQL);

      server.log.info(
        `SQL for  ${tableName} processed successfully on start-up`,
      );
    }

    // Disconnect from DB
    await knex.destroy();
  } catch (error: any) {
    const customError = createCustomError(
      "Error while executing Table SQLs on startup",
      StatusCodes.INTERNAL_SERVER_ERROR,
      "SERVER_STARTUP_TABLES_CREATION_ERROR",
    );
    throw customError;
  }
};

export const implementTriggerOnStartUp = async (
  server: FastifyInstance,
): Promise<void> => {
  try {
    // Connect to the DB
    const knex = await connectWithDatabase(server);

    const triggersList: string[] = getEnv(
      "DB_TRIGGERS_LIST",
      DB_TRIGGERS_LIST_DEFAULT,
    )
      .split(",")
      .map(function (item: any) {
        return item.trim();
      });

    if (!triggersList) {
      const error = createCustomError(
        "DB_TRIGGERS_LIST ENV variable is empty",
        StatusCodes.NOT_FOUND,
        "DB_TRIGGERS_LIST_NOT_FOUND",
      );
      throw error;
    }

    for (const dbTriggers of triggersList) {
      try {
        server.log.debug(`Reading Trigger File ${dbTriggers}.sql`);
        const schemaSQL = await fs.readFile(
          `${__dirname}/sql-schemas/${dbTriggers}.sql`,
          "utf-8",
        );
        await knex.raw(schemaSQL);
      } catch (error) {
        const customError = createCustomError(
          "Error when executing triggers.",
          StatusCodes.INTERNAL_SERVER_ERROR,
          "INTERNAL_SERVER_ERROR",
        );
        throw customError;
      }

      server.log.info(
        `Trigger ${dbTriggers} created/replaced on startup successfully`,
      );
    }

    // Disconnect from DB
    await knex.destroy();
  } catch (error: any) {
    const customError = createCustomError(
      "Error while executing Trigger/Notification SQLs on startup",
      StatusCodes.INTERNAL_SERVER_ERROR,
      "SERVER_STARTUP_TRIGGER_CREATION_ERROR",
    );
    throw customError;
  }
};