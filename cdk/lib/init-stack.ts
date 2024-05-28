import { Stack, StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class GashaInitStack extends Stack {
  readonly vpc: ec2.IVpc;
  readonly ec2BastionSecurityGroup: ec2.ISecurityGroup;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, "Gasha-VPC", {
      vpcId: "vpc-089daef87b714632f",
    });

    const ec2BastionSecurityGroup = ec2.SecurityGroup.fromLookupById(
      this,
      "Gasha-Bastion-SG",
      "sg-0e8d56d937b854e64",
    );

    this.vpc = vpc;
    this.ec2BastionSecurityGroup = ec2BastionSecurityGroup;
  }
}
