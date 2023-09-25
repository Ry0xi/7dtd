import * as cdk from "aws-cdk-lib";
import {
    aws_iam as iam,
    aws_ec2 as ec2,
    StackProps,
  } from "aws-cdk-lib";
import { Construct } from "constructs";

export interface SdtdBaseProps extends StackProps {
    myIP: string;
}

export interface SdtdBase {
    vpc: ec2.Vpc;
    securityGroup: ec2.SecurityGroup;
    ec2role: iam.Role;
    fleetSpotRoleArn: string;
    subnets: string[];
}

export class SdtdBaseStack extends cdk.Stack {
    public readonly base: SdtdBase;
    public readonly apiUrl: string;

    constructor(scope: Construct, id: string, props: SdtdBaseProps) {
        super(scope, id, props);

        // VPC
        const vpc = new ec2.Vpc(this, '7dtdVpc');

        // Security Group
        const securityGroup = new ec2.SecurityGroup(this, '7dtdSG', {
            vpc,
            description: 'Allow Ports for 7dtd',
            allowAllOutbound: true,
        });
        securityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(26900),
            'Allow Ports for 7dtd',
        );
        securityGroup.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.udpRange(26900, 26902),
            'Allow Ports for 7dtd',
        );

        // IAM Policy
        const policy = new iam.ManagedPolicy(this, "EC2Policy", {
            description: "",
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        "ec2:DescribeVolumes",
                        "ec2:DescribeSnapshots",
                        "ec2:DeleteSnapshot",
                        "ec2:CreateSnapshot",
                        "ec2:DetachVolume",
                        "ec2:AttachVolume",
                        "ec2:DeleteVolume",
                        "ec2:CreateVolume",
                        "ec2:CreateTags",
                    ],
                    resources: ["*"],
                }),
            ],
        });

        // IAM Role
        const fleetSpotRole = new iam.Role(this, "spotfleetRole", {
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    "service-role/AmazonEC2SpotFleetTaggingRole"
                ),
            ],
            assumedBy: new iam.ServicePrincipal("spotfleet.amazonaws.com"),
            path: '/',
        });

        const ec2Role = new iam.Role(this, 'EC2Role', {
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ReadOnlyAccess"),
                policy,
            ],
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            path: '/',
        });

        this.base = {
            vpc: vpc,
            securityGroup: securityGroup,
            ec2role: ec2Role,
            fleetSpotRoleArn: fleetSpotRole.roleArn,
            subnets: vpc.publicSubnets.map((d) => d.subnetId),
        };

        // TODO: Lambda & API Gateway
    }
}
