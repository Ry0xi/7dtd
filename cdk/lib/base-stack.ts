import path = require('path');

import type { StackProps } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import {
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_lambda as lambda,
    aws_s3 as s3,
} from 'aws-cdk-lib';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import type { Construct } from 'constructs';

export interface SdtdBaseProps extends StackProps {
    prefix: string;
    myIP: string;
    serverName: string;
    sshPublicKey: string;
}

export interface SdtdBase {
    vpc: ec2.Vpc;
    securityGroup: ec2.SecurityGroup;
    ec2role: iam.Role;
    fleetSpotRoleArn: string;
    subnets: string[];
    keyPairName: string;
}

export class SdtdBaseStack extends cdk.Stack {
    public readonly base: SdtdBase;
    public readonly apiUrl: string;

    constructor(scope: Construct, id: string, props: SdtdBaseProps) {
        super(scope, id, props);

        // VPC
        const vpc = new ec2.Vpc(this, '7dtdVpc', {
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'public',
                    subnetType: ec2.SubnetType.PUBLIC,
                },
            ],
            maxAzs: 1,
        });

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
        securityGroup.addIngressRule(
            ec2.Peer.ipv4(props.myIP),
            ec2.Port.tcp(22),
            'ssh access from home',
        );

        // S3
        const s3Bucket = new s3.Bucket(this, 'ServerConfigFileBucket', {
            bucketName: props.prefix,
            versioned: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
            encryption: s3.BucketEncryption.S3_MANAGED,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });

        // IAM Policy
        const policy = new iam.ManagedPolicy(this, 'EC2Policy', {
            description: '',
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'ec2:DescribeVolumes',
                        'ec2:DescribeSnapshots',
                        'ec2:DeleteSnapshot',
                        'ec2:CreateSnapshot',
                        'ec2:DetachVolume',
                        'ec2:AttachVolume',
                        'ec2:DeleteVolume',
                        'ec2:CreateVolume',
                        'ec2:CreateTags',
                    ],
                    resources: ['*'],
                }),
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'kms:Decrypt',
                        'ssm:GetParametersByPath',
                        'ssm:GetParameters',
                        'ssm:GetParameter',
                        'ssm:PutParameter',
                    ],
                    resources: [
                        'arn:aws:kms:*:*:key/CMK',
                        `arn:aws:ssm:*:*:parameter/${props.prefix}/*`,
                    ],
                }),
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['ec2:ModifySpotFleetRequest'],
                    resources: [
                        'arn:aws:ec2:*:*:launch-template/*',
                        'arn:aws:ec2:*:*:spot-fleet-request/*',
                        'arn:aws:ec2:*:*:subnet/*',
                    ],
                }),
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['s3:ListBucket'],
                    resources: [`arn:aws:s3:::${s3Bucket.bucketName}`],
                }),
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['s3:GetObject'],
                    resources: [`arn:aws:s3:::${s3Bucket.bucketName}/*`],
                }),
            ],
        });

        const lambdaPolicy = new iam.Policy(this, 'lambdaPolicy', {
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'kms:Decrypt',
                        'ssm:GetParametersByPath',
                        'ssm:GetParameters',
                        'ssm:GetParameter',
                        'ssm:PutParameter',
                    ],
                    resources: [
                        'arn:aws:kms:*:*:key/CMK',
                        `arn:aws:ssm:*:*:parameter/${props.prefix}/*`,
                    ],
                }),
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['ec2:ModifySpotFleetRequest'],
                    resources: [
                        'arn:aws:ec2:*:*:launch-template/*',
                        'arn:aws:ec2:*:*:spot-fleet-request/*',
                        'arn:aws:ec2:*:*:subnet/*',
                    ],
                }),
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'ec2:DescribeInstances',
                        'ec2:DescribeSpotFleetRequests',
                        'ec2:DescribeSpotFleetInstances',
                    ],
                    resources: ['*'],
                }),
            ],
        });

        // IAM Role
        const fleetSpotRole = new iam.Role(this, 'spotfleetRole', {
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    'service-role/AmazonEC2SpotFleetTaggingRole',
                ),
            ],
            assumedBy: new iam.ServicePrincipal('spotfleet.amazonaws.com'),
            path: '/',
        });

        const ec2Role = new iam.Role(this, 'EC2Role', {
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    'AmazonS3FullAccess',
                ),
                iam.ManagedPolicy.fromAwsManagedPolicyName(
                    'AmazonEC2ReadOnlyAccess',
                ),
                policy,
            ],
            assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
            path: '/',
        });

        // ssh key pair
        const keyPair = new ec2.CfnKeyPair(this, 'MyCfnKeyPair', {
            keyName: `${this.stackName}KeyPair`,
            publicKeyMaterial: props.sshPublicKey,
        });
        keyPair.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

        this.base = {
            vpc: vpc,
            securityGroup: securityGroup,
            ec2role: ec2Role,
            fleetSpotRoleArn: fleetSpotRole.roleArn,
            subnets: vpc.publicSubnets.map((d) => d.subnetId),
            keyPairName: keyPair.keyName,
        };

        // Lambda
        const commandFunc = new NodejsFunction(this, 'ServerCommand', {
            entry: path.join(
                __dirname,
                '../../functions/handlers/server-command-handler/index.ts',
            ),
            depsLockFilePath: path.join(
                __dirname,
                '../../functions/package-lock.json',
            ),
            runtime: lambda.Runtime.NODEJS_18_X,
            // NOTE: aws-lambda-power-tuningでコスト最適と出た
            memorySize: 128,
            timeout: cdk.Duration.seconds(300),
            environment: {
                PREFIX: props.prefix,
                SERVER_NAME: props.serverName,
            },
            bundling: {
                minify: true,
                tsconfig: path.join(
                    __dirname,
                    '../../functions/tsconfig.build.json',
                ),
                // https://middy.js.org/docs/best-practices/bundling#bundlers
                externalModules: [],
            },
        });

        const handler = new NodejsFunction(this, 'DiscordBot', {
            entry: path.join(
                __dirname,
                '../../functions/handlers/discord-bot-handler/index.ts',
            ),
            depsLockFilePath: path.join(
                __dirname,
                '../../functions/package-lock.json',
            ),
            runtime: lambda.Runtime.NODEJS_18_X,
            /**
             * NOTE: 128MBだとメモリ不足
             * 256MBだとメモリは足りているが、コールドスタート時にDiscordの初回応答の時間制限に間に合わないので512MB
             * 256MBがaws-lambda-power-tuningでコスト最適と出た
             */
            memorySize: 512,
            timeout: cdk.Duration.seconds(300),
            environment: {
                PREFIX: props.prefix,
                CMDFUNC: commandFunc.functionArn,
                SERVER_NAME: props.serverName,
            },
            bundling: {
                minify: true,
                tsconfig: path.join(
                    __dirname,
                    '../../functions/tsconfig.build.json',
                ),
                // https://middy.js.org/docs/best-practices/bundling#bundlers
                externalModules: [],
            },
        });

        handler.role?.attachInlinePolicy(lambdaPolicy);
        if (commandFunc.role === undefined) return;
        commandFunc.role.attachInlinePolicy(lambdaPolicy);
        commandFunc.grantInvoke(handler);

        handler.addFunctionUrl({
            authType: FunctionUrlAuthType.NONE,
        });
    }
}
