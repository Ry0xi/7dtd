import { EC2Client } from '@aws-sdk/client-ec2';
import {
    DescribeSpotFleetRequestsCommand,
    ModifySpotFleetRequestCommand,
} from '@aws-sdk/client-ec2';
import middy from '@middy/core';
import httpErrorHandlerMiddleware from '@middy/http-error-handler';
import httpJsonBodyParserMiddleware from '@middy/http-json-body-parser';
import inputOutputLoggerMiddleware from '@middy/input-output-logger';
import validatorMiddleware from '@middy/validator';
import { transpileSchema } from '@middy/validator/transpile';
import type { APIGatewayProxyResult } from 'aws-lambda';

import type {
    ApplicationCommandInteractionData,
    EventType,
} from '@/functions/common/interaction-event-schema';
import { eventSchema } from '@/functions/common/interaction-event-schema';
import { getEnv, getParameter } from '@/functions/common/utils';

const getServerName = (data: ApplicationCommandInteractionData): string => {
    for (const option of data.options) {
        if (option.name === 'server' && typeof option.value === 'string') {
            return option.value;
        }
    }

    return '';
};

const getCapacity = async (
    client: EC2Client,
    sfrId: string,
): Promise<number> => {
    const command = new DescribeSpotFleetRequestsCommand({
        SpotFleetRequestIds: [sfrId],
    });

    const response = await client.send(command);

    if (
        response.SpotFleetRequestConfigs !== undefined &&
        response.SpotFleetRequestConfigs[0].SpotFleetRequestConfig
            ?.TargetCapacity !== undefined
    )
        return response.SpotFleetRequestConfigs[0].SpotFleetRequestConfig
            .TargetCapacity;

    throw new Error(
        `SpotFleetのターゲットキャパシティの取得に失敗しました。\nsfrId: ${sfrId}`,
    );
};

const setCapacity = async (
    client: EC2Client,
    sfrId: string,
    capacity: number,
): Promise<void> => {
    const command = new ModifySpotFleetRequestCommand({
        SpotFleetRequestId: sfrId,
        TargetCapacity: capacity,
    });

    await client.send(command);
};

const sendToDiscord = async (
    applicationId: string,
    token: string,
    content: string,
): Promise<void> => {
    const url = `https://discord.com/api/v10/webhooks/${applicationId}/${token}`;

    const params = {
        method: 'POST',
        body: JSON.stringify({
            content: content,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const response = await fetch(url, params);

    if (!response.ok) {
        console.warn('Could not post to discord. message:', content);
        console.warn('response', await response.json());
    }
};

export const handleServerCommand = async (
    event: EventType,
): Promise<APIGatewayProxyResult> => {
    console.log('Start handling server command.');

    const data = event.body.data;
    if (data === undefined)
        throw new Error('"data" is required to start server.');

    const serverName = getServerName(data);

    const discordApplicationId = event.body.application_id;
    const discordToken = event.body.token;

    // start コマンドならサーバーを起動
    if (data.name === 'start') {
        try {
            const sfrId = await getParameter(
                `/${getEnv('PREFIX')}/${serverName}/sfrID`,
            );

            // サーバーが既に稼働している場合は何もせず通知
            const ec2Client = new EC2Client();
            const capacity = await getCapacity(ec2Client, sfrId);
            if (capacity > 0) {
                await sendToDiscord(
                    discordApplicationId,
                    discordToken,
                    `🖥️サーバー[${serverName}]はすでに稼働中です`,
                );
                return {
                    statusCode: 200,
                    body: `Server [${serverName}] already started.`,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                };
            }

            // サーバー起動
            await setCapacity(ec2Client, sfrId, 1);

            await sendToDiscord(
                discordApplicationId,
                discordToken,
                `🖥️サーバー[${serverName}]を起動します👌 \n正常に起動開始出来ました😊`,
            );
        } catch (error) {
            await sendToDiscord(
                discordApplicationId,
                discordToken,
                `🖥️サーバー[${serverName}]の起動でエラーが発生しました😢\nしばらくしてからもう一度お試しください🙏`,
            );
            throw error;
        }
    }

    return {
        statusCode: 200,
        body: `Server [${serverName}] started.`,
        headers: {
            'Content-Type': 'application/json',
        },
    };
};

export const handler = middy<EventType>()
    .use(inputOutputLoggerMiddleware())
    .use(httpJsonBodyParserMiddleware())
    .use(
        validatorMiddleware({
            eventSchema: transpileSchema(eventSchema, { coerceTypes: false }),
        }),
    )
    .use(httpErrorHandlerMiddleware())
    .handler(handleServerCommand);
