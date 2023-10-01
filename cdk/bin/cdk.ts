#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { SdtdBaseStack } from '@/cdk/lib/base-stack';
import { SdtdCdkStack } from '@/cdk/lib/sdtd-cdk-stack';
import { getMyIP, getRequiredEnv, sshPublicKey } from '@/cdk/lib/utils';

const prefix = getRequiredEnv('PREFIX');
const serverName = getRequiredEnv('SERVER_NAME');

const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

const baseStack = new SdtdBaseStack(app, `${prefix}Base`, {
    env: env,
    prefix: prefix,
    myIP: getMyIP(),
    serverName: serverName,
    sshPublicKey: sshPublicKey(),
});

new SdtdCdkStack(app, serverName, {
    env: env,
    prefix: prefix,
    volumeSize: 20,
    snapshotGen: 3,
    base: baseStack.base,
    discordPublicKey: getRequiredEnv('DISCORD_PUBLIC_KEY'),
    discordChannelId: getRequiredEnv('DISCORD_CHANNEL_ID'),
    discordBotToken: getRequiredEnv('DISCORD_BOT_TOKEN'),
});
