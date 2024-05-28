#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "source-map-support/register";
import { getConfig } from "../config";
import { AppStack } from "../lib/app-stack";
import { GashaInitStack } from "../lib/init-stack";
import { RdsStack } from "../lib/rds-stack";
import { RedisStack } from "../lib/redis-stack";

const app = new cdk.App();

const stage = "main";
const serviceName = "TWE";
const config = getConfig(stage);

const { vpc, ec2BastionSecurityGroup } = new GashaInitStack(
  app,
  `GashaInitStack`,
  {
    description: "Gasha Init Stack",
    tags: {
      service: "Gasha",
    },
    env: {
      account: config.aws.accountId,
      region: config.aws.region,
    },
  },
);

const { appRunnerSecurityGroup } = new RdsStack(
  app,
  `${stage}${serviceName}RdsStack`,
  {
    description: `${stage} ${serviceName} Rds Stack`,
    tags: {
      service: serviceName,
      stage: stage,
    },
    env: {
      account: config.aws.accountId,
      region: config.aws.region,
    },
  },
  {
    vpc,
    config,
    ec2BastionSecurityGroup,
  },
);

const { redis } = new RedisStack(
  app,
  `${stage}${serviceName}RedisStack`,
  {
    description: `${stage} ${serviceName} Redis Stack`,
    tags: {
      service: serviceName,
      stage: stage,
    },
    env: {
      account: config.aws.accountId,
      region: config.aws.region,
    },
  },
  {
    vpc,
    ec2BastionSecurityGroup,
    config,
    appRunnerSecurityGroup,
  },
);

new AppStack(
  app,
  `${stage}${serviceName}AppStack`,
  {
    description: `${stage} ${serviceName} App Stack`,
    tags: {
      service: serviceName,
      stage: stage,
    },
    env: {
      account: config.aws.accountId,
      region: config.aws.region,
    },
  },
  {
    vpc,
    redis,
    config,
    appRunnerSecurityGroup,
  },
);
