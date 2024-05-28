import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elasticache from "aws-cdk-lib/aws-elasticache";
import { Construct } from "constructs";
import { Config } from "../config";

interface RedisProps {
  vpc: ec2.IVpc;
  redisSecurityGroup: ec2.SecurityGroup;
  config: Config;
}

export class Redis extends Construct {
  readonly redis: elasticache.CfnCacheCluster;

  constructor(scope: Construct, id: string, props: RedisProps) {
    super(scope, id);

    const { vpc, redisSecurityGroup, config } = props;

    const subnetGroup = new elasticache.CfnSubnetGroup(
      this,
      "RedisSubnetGroup",
      {
        description: `${config.stage}-${config.serviceName}-Redis-Subnet-Group`,
        subnetIds: vpc.privateSubnets.map((subnet) => subnet.subnetId),
      },
    );

    this.redis = new elasticache.CfnCacheCluster(this, "Redis", {
      cacheNodeType: "cache.t3.micro",
      engine: "redis",
      numCacheNodes: 1,
      clusterName: `${config.stage}-${config.serviceName}-Redis`,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      cacheSubnetGroupName: subnetGroup.ref,
    });
  }
}
