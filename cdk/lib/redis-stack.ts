import { Stack, StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elasticache from "aws-cdk-lib/aws-elasticache";
import { Construct } from "constructs";
import { Config } from "../config";
import { Redis } from "../construct/redis";

interface AppProps {
  vpc: ec2.IVpc;
  config: Config;
  ec2BastionSecurityGroup: ec2.ISecurityGroup;
  appRunnerSecurityGroup: ec2.SecurityGroup;
}

export class RedisStack extends Stack {
  readonly redisSecurityGroup: ec2.SecurityGroup;
  readonly redis: elasticache.CfnCacheCluster;

  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    appProps: AppProps,
  ) {
    super(scope, id, props);

    const { vpc, config, ec2BastionSecurityGroup, appRunnerSecurityGroup } =
      appProps;

    this.redisSecurityGroup = new ec2.SecurityGroup(
      this,
      `${config.stage}-${config.serviceName}-Redis-SG`,
      {
        allowAllOutbound: true,
        securityGroupName: `${appProps.config.stage}-${appProps.config.serviceName}-Redis-SG`,
        vpc: vpc,
      },
    );

    this.redisSecurityGroup.addIngressRule(
      ec2BastionSecurityGroup,
      ec2.Port.tcp(6379),
      "Allow Bastion to access the Redis",
    );

    this.redisSecurityGroup.addIngressRule(
      appRunnerSecurityGroup,
      ec2.Port.tcp(6379),
      "Allow AppRunner to access the Redis",
    );

    this.redis = new Redis(this, "Redis", {
      vpc,
      redisSecurityGroup: this.redisSecurityGroup,
      config,
    }).redis;
  }
}
