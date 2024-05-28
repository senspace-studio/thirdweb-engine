import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elasticache from "aws-cdk-lib/aws-elasticache";
import { Construct } from "constructs";
import { Config } from "../config";
import { AppRunner } from "../construct/apprunner";

interface AppProps {
  vpc: ec2.IVpc;
  config: Config;
  redis: elasticache.CfnCacheCluster;
  appRunnerSecurityGroup: ec2.SecurityGroup;
}

export class AppStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: cdk.StackProps,
    appProps: AppProps,
  ) {
    super(scope, id, props);

    const { vpc, config, appRunnerSecurityGroup, redis } = appProps;

    new AppRunner(this, "AppRunner", {
      vpc,
      redis,
      appRunnerSecurityGroup,
      config,
    });
  }
}
