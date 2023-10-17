import { Prisma } from "@prisma/client";
import { prisma } from "../client";
import { getConfiguration } from "./getConfiguration";

export const updateConfiguration = async (
  data: Prisma.ConfigurationUpdateArgs["data"],
) => {
  const config = await getConfiguration();
  return prisma.configuration.update({
    where: {
      id: config.id,
    },
    data,
  });
};