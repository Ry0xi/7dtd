import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Asset } from "aws-cdk-lib/aws-s3-assets";
import { SdtdBase } from "./base-stack";

export interface SdtdProps extends cdk.StackProps {
	base: SdtdBase;
}

export class SdtdCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props: SdtdProps) {
    super(scope, id, props);

    const asset = new Asset(this, "Asset", { path: "../files" });

    const setupCommands = ec2.UserData.forLinux();
    setupCommands.addCommands(
      `aws s3 cp s3://${asset.s3BucketName}/${asset.s3ObjectKey} /tmp/files.zip >> /var/tmp/setup`,
      `unzip -d /var/lib/ /tmp/files.zip >>/var/tmp/setup`,
      `bash /var/lib/scripts/user-data.sh`
    );

    const multipartUserData = new ec2.MultipartUserData();
    multipartUserData.addPart(ec2.MultipartBody.fromUserData(setupCommands));

    const launchTemplateName = `${this.stackName}Template`;
    const template = new ec2.LaunchTemplate(this, "template", {
      userData: multipartUserData,
      keyName: '7dtdEc2Key',
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      launchTemplateName: launchTemplateName,
      securityGroup: props.base.securityGroup,
      role: props.base.ec2role,
    });

    new ec2.CfnSpotFleet(this, "SpotFleet", {
      spotFleetRequestConfigData: {
        iamFleetRole: props.base.fleetSpotRoleArn,
        allocationStrategy: "lowestPrice",
        terminateInstancesWithExpiration: false,
        targetCapacity: 0,
        type: "maintain",
        targetCapacityUnitType: "units",
        onDemandAllocationStrategy: "lowestPrice",
        launchTemplateConfigs: [
          {
            launchTemplateSpecification: {
              launchTemplateId: template.launchTemplateId || "",
              version: template.latestVersionNumber,
            },
            overrides: [
              {
                subnetId: props.base.subnets.join(","),
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
  }
}
