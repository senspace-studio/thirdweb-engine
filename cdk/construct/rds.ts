import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import { Construct } from "constructs";
import { Config } from "../config";

interface RdsProps {
  vpc: ec2.IVpc;
  dbSecurityGroup: ec2.SecurityGroup;
  config: Config;
}

export class Rds extends Construct {
  constructor(scope: Construct, id: string, props: RdsProps) {
    super(scope, id);

    const { vpc, dbSecurityGroup } = props;

    const rdsCredentials = rds.Credentials.fromUsername("engine", {
      secretName: `${
        props.config.stage
      }-${props.config.serviceName.toLowerCase()}-db-secret`,
    });

    const instanceParameterGroup = new rds.ParameterGroup(
      scope,
      `${props.config.serviceName}-DB-InstanceParameterGroup`,
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16_3,
        }),
        description: `${props.config.serviceName} DB Instance Parameter Group`,
      },
    );

    new rds.DatabaseInstance(scope, `${props.config.serviceName}-DB`, {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_3,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        props.config.stage === "main"
          ? ec2.InstanceSize.MICRO
          : ec2.InstanceSize.MICRO,
      ),
      multiAz: false,
      allocatedStorage: 8,
      maxAllocatedStorage: 16,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      credentials: rdsCredentials,
      securityGroups: [dbSecurityGroup],
      parameterGroup: instanceParameterGroup,
      databaseName: `${props.config.serviceName.toLowerCase()}`,
    });
  }
}
