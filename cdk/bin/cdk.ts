#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { SdtdBaseStack } from '@/cdk/lib/base-stack';
import { SdtdCdkStack } from '@/cdk/lib/sdtd-cdk-stack';
import { getMyIP } from '@/cdk/lib/utils';

const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
};

const app = new cdk.App();

const baseStack = new SdtdBaseStack(app, 'SdtdBase', {
    env: env,
    myIP: getMyIP(),
});

const serverName = 'SdtdPVE01';
new SdtdCdkStack(app, serverName, {
    env: env,
    volumeSize: 20,
    base: baseStack.base,
});
