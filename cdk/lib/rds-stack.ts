import { Stack, StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { Config } from "../config";
import { Rds } from "../construct/rds";
import { SecurityGroup } from "../construct/sg";

interface AppProps {
  vpc: ec2.IVpc;
  config: Config;
  ec2BastionSecurityGroup: ec2.ISecurityGroup;
}

export class RdsStack extends Stack {
  readonly appRunnerSecurityGroup: ec2.SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    props: StackProps,
    appProps: AppProps,
  ) {
    super(scope, id, props);

    const { vpc, config, ec2BastionSecurityGroup } = appProps;

    const { appRunnerSecurityGroup, dbSecurityGroup } = new SecurityGroup(
      this,
      "SecurityGroup",
      {
        vpc,
        config,
        ec2BastionSecurityGroup,
      },
    );

    new Rds(this, "Rds", {
      vpc,
      dbSecurityGroup,
      config,
    });

    this.appRunnerSecurityGroup = appRunnerSecurityGroup;
  }
}
