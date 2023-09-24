import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

import { Construct } from 'constructs';

export class SdtdCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPCの作成
    const vpc = new ec2.Vpc(this, '7dtdVpc')

    // EC2インスタンスの作成
    const instance = new ec2.Instance(this, '7dtdInstance', {
      vpc,
      instanceType: new ec2.InstanceType('t2.medium'),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      keyName: '7dtdEc2Key',
    });

    // // 7dtdの必要なポートを開放
    instance.connections.allowFromAnyIpv4(ec2.Port.tcp(26900));
    instance.connections.allowFromAnyIpv4(ec2.Port.udp(26900));
    instance.connections.allowFromAnyIpv4(ec2.Port.udp(26901));
    instance.connections.allowFromAnyIpv4(ec2.Port.udp(26902));
  }
}
