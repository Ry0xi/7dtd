#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SdtdCdkStack } from '../lib/sdtd-cdk-stack';
import { SdtdBaseStack } from '../lib/base-stack';
import { getMyIP } from '../lib/utils';

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
    base: baseStack.base,
});