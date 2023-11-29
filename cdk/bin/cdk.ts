#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { SdtdBaseStack } from '@/cdk/lib/base-stack';
import { SdtdCdkStack } from '@/cdk/lib/sdtd-cdk-stack';
import { getMyIP, getRequiredEnv, sshPublicKey } from '@/cdk/lib/utils';

const prefix = getRequiredEnv('PREFIX');

const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

const baseStack = new SdtdBaseStack(app, `${prefix}Base`, {
    env: env,
    prefix: prefix,
    myIP: getMyIP(),
    sshPublicKey: sshPublicKey(),
});

[
    {
        serverName: 'SdtdPVE01',
        props: {
            env: env,
            prefix: prefix,
            volumeSize: 20,
            snapshotGen: 3,
            base: baseStack.base,
            discordPublicKey: getRequiredEnv('DISCORD_PUBLIC_KEY'),
            discordChannelId: getRequiredEnv('DISCORD_CHANNEL_ID'),
            discordBotToken: getRequiredEnv('DISCORD_BOT_TOKEN'),
            instanceRequirememtsOverrides: [
                {
                    subnetId: baseStack.base.subnets.join(','),
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
    },
    {
        serverName: 'SdtdPVE02-MOD',
        props: {
            env: env,
            prefix: prefix,
            // Darkness Fallsは追加で8GBくらい必要
            volumeSize: 30,
            snapshotGen: 3,
            base: baseStack.base,
            discordPublicKey: getRequiredEnv('DISCORD_PUBLIC_KEY'),
            discordChannelId: getRequiredEnv('DISCORD_CHANNEL_ID'),
            discordBotToken: getRequiredEnv('DISCORD_BOT_TOKEN'),
            dockerComposeFileName: 'docker-compose-SdtdPVE02_MOD.yaml',
            instanceRequirememtsOverrides: [
                {
                    subnetId: baseStack.base.subnets.join(','),
                    instanceRequirements: {
                        vCpuCount: {
                            max: 4,
                            min: 2,
                        },
                        memoryMiB: {
                            min: 16384,
                            max: 16384,
                        },
                    },
                },
            ],
        },
    },
].map((config) => {
    new SdtdCdkStack(app, config.serverName, config.props);
});
