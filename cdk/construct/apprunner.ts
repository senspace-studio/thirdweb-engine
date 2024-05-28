import * as apprunner from "aws-cdk-lib/aws-apprunner";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elasticache from "aws-cdk-lib/aws-elasticache";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { Config } from "../config";

interface AppRunnerProps {
  vpc: ec2.IVpc;
  appRunnerSecurityGroup: ec2.ISecurityGroup;
  redis: elasticache.CfnCacheCluster;
  config: Config;
}

export class AppRunner extends Construct {
  constructor(scope: Construct, id: string, props: AppRunnerProps) {
    super(scope, id);

    const { vpc, appRunnerSecurityGroup, redis } = props;

    const instanceRole = new iam.Role(
      scope,
      `${props.config.stage}-${props.config.serviceName}-AppRunner-Role`,
      {
        roleName: `${props.config.stage}-${props.config.serviceName}-AppRunner-Role`,
        assumedBy: new iam.ServicePrincipal("tasks.apprunner.amazonaws.com"),
      },
    );

    const accessRole = new iam.Role(
      scope,
      `${props.config.stage}-${props.config.serviceName}-AppRunner-AccessRole`,
      {
        roleName: `${props.config.stage}-${props.config.serviceName}-AppRunner-AccessRole`,
        assumedBy: new iam.ServicePrincipal("build.apprunner.amazonaws.com"),
      },
    );
    accessRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        "service-role/AWSAppRunnerServicePolicyForECRAccess",
      ),
    );

    const secretsDB = secretsmanager.Secret.fromSecretNameV2(
      scope,
      `${
        props.config.stage
      }-${props.config.serviceName.toLowerCase()}-db-secret-${
        props.config.dbSecretSuffix
      }`,
      `${
        props.config.stage
      }-${props.config.serviceName.toLowerCase()}-db-secret-${
        props.config.dbSecretSuffix
      }`,
    );

    const vpcConnector = new apprunner.CfnVpcConnector(
      scope,
      `${props.config.stage}-${props.config.serviceName}-AppRunner-VpcConnector`,
      {
        subnets: vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }).subnetIds,
        securityGroups: [appRunnerSecurityGroup.securityGroupId],
        vpcConnectorName: `${
          props.config.stage
        }-${props.config.serviceName.toLowerCase()}-apprunner-vpc-connector`,
      },
    );

    const redisURL = redis.attrRedisEndpointAddress;
    // prettier-ignore
    const postgresConnectionURL = `postgresql://${secretsDB.secretValueFromJson("username").unsafeUnwrap().toString()}:${secretsDB.secretValueFromJson("password").unsafeUnwrap().toString()}@${secretsDB.secretValueFromJson("host").unsafeUnwrap().toString()}:5432/${secretsDB.secretValueFromJson("dbname").unsafeUnwrap().toString()}?connection_limit=10`;

    new apprunner.CfnService(
      scope,
      `${props.config.stage}-${props.config.serviceName}-AppRunner`,
      {
        sourceConfiguration: {
          authenticationConfiguration: {
            accessRoleArn: accessRole.roleArn,
          },
          autoDeploymentsEnabled: true,
          imageRepository: {
            imageRepositoryType: "ECR",
            imageIdentifier: `726394863183.dkr.ecr.ap-northeast-1.amazonaws.com/thirdweb-engine:v0.9.2`,
            imageConfiguration: {
              port: "3005",
              runtimeEnvironmentVariables: [
                {
                  name: "PORT",
                  value: "3005",
                },
                {
                  name: "NODE_ENV",
                  value: "production",
                },
                {
                  name: "POSTGRES_CONNECTION_URL",
                  value: postgresConnectionURL,
                },
                {
                  name: "REDIS_URL",
                  value: redisURL,
                },
                {
                  name: "LOG_LEVEL",
                  value: "error",
                },
                {
                  name: "THIRDWEB_API_SECRET_KEY",
                  value: props.config.thirdwebAPISecretKey,
                },
                {
                  name: "ENCRYPTION_PASSWORD",
                  value: props.config.thirdwebEngineEncryptionPassword,
                },
                {
                  name: "ADMIN_WALLET_ADDRESS",
                  value: "0xdCb93093424447bF4FE9Df869750950922F1E30B",
                },
              ],
            },
          },
        },
        healthCheckConfiguration: {
          path: "/json",
          interval: 20,
        },
        instanceConfiguration: {
          instanceRoleArn: instanceRole.roleArn,
          cpu: props.config.stage === "main" ? "1024" : "256",
          memory: props.config.stage === "main" ? "2048" : "512",
        },
        networkConfiguration: {
          egressConfiguration: {
            egressType: "VPC",
            vpcConnectorArn: vpcConnector.attrVpcConnectorArn,
          },
        },

        serviceName: `${
          props.config.stage
        }-${props.config.serviceName.toLowerCase()}-apprunner`,
      },
    );
  }
}
