import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Asset } from 'aws-cdk-lib/aws-s3-assets';
import * as ssm from 'aws-cdk-lib/aws-ssm';

import type { SdtdBase } from '@/cdk/lib/base-stack';

export interface SdtdProps extends cdk.StackProps {
    prefix: string;
    // EBSボリュームサイズ(GB)
    volumeSize: number;
    snapshotGen: number;
    base: SdtdBase;
    discordPublicKey: string;
    discordChannelId: string;
    discordBotToken: string;
}

export class SdtdCdkStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: SdtdProps) {
        super(scope, id, props);

        const asset = new Asset(this, 'Asset', { path: '../files' });

        const setupCommands = ec2.UserData.forLinux();
        setupCommands.addCommands(
            `aws s3 cp s3://${asset.s3BucketName}/${asset.s3ObjectKey} /tmp/files.zip >> /var/tmp/setup`,
            `unzip -d /var/lib/ /tmp/files.zip >>/var/tmp/setup`,
            'chmod -R +x /var/lib',
            `bash /var/lib/scripts/user-data.sh ${this.stackName} ${props.volumeSize} ${props.prefix} ${props.snapshotGen}`,
        );

        const multipartUserData = new ec2.MultipartUserData();
        multipartUserData.addPart(
            ec2.MultipartBody.fromUserData(setupCommands),
        );

        const launchTemplateName = `${this.stackName}Template`;
        const template = new ec2.LaunchTemplate(this, 'template', {
            userData: multipartUserData,
            keyName: props.base.keyPairName,
            machineImage: ec2.MachineImage.latestAmazonLinux2(),
            launchTemplateName: launchTemplateName,
            securityGroup: props.base.securityGroup,
            role: props.base.ec2role,
        });

        const cfnSpotFleet = new ec2.CfnSpotFleet(this, 'SpotFleet', {
            spotFleetRequestConfigData: {
                iamFleetRole: props.base.fleetSpotRoleArn,
                allocationStrategy: 'lowestPrice',
                terminateInstancesWithExpiration: false,
                targetCapacity: 0,
                type: 'maintain',
                targetCapacityUnitType: 'units',
                onDemandAllocationStrategy: 'lowestPrice',
                launchTemplateConfigs: [
                    {
                        launchTemplateSpecification: {
                            launchTemplateId: template.launchTemplateId || '',
                            version: template.latestVersionNumber,
                        },
                        overrides: [
                            {
                                subnetId: props.base.subnets.join(','),
                                instanceRequirements: {
                                    vCpuCount: {
                                        max: 4,
                                        min: 2,
                                    },
                                    memoryMiB: {
                                        min: 7168,
                                        max: 16384,
                                    },
                                },
                            },
                        ],
                    },
                ],
            },
        });

        const params = [
            { key: 'sfrID', value: cfnSpotFleet.attrId },
            { key: 'volumeSize', value: `${props.volumeSize}` },
            { key: 'snapshotGen', value: `${props.snapshotGen}` },
            { key: 'discordPublicKey', value: `${props.discordPublicKey}` },
            { key: 'discordChannelId', value: `${props.discordChannelId}` },
            { key: 'discordBotToken', value: `${props.discordBotToken}` },
            { key: 'maintenance', value: 'false' },
        ].map((kv) => ({
            kv: kv,
            param: new ssm.StringParameter(this, kv.key, {
                allowedPattern: '.*',
                description: `${kv.key}`,
                parameterName: `/${props.prefix}/${this.stackName}/${kv.key}`,
                stringValue: kv.value,
                tier: ssm.ParameterTier.STANDARD,
            }),
        }));

        params.map(
            (param) =>
                new cdk.CfnOutput(this, `Key${param.kv.key}`, {
                    value: param.param.stringValue,
                }),
        );
    }
}
