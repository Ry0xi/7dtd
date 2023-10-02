import {
    DescribeInstancesCommand,
    DescribeSpotFleetInstancesCommand,
    EC2Client,
} from '@aws-sdk/client-ec2';
import {
    DescribeSpotFleetRequestsCommand,
    ModifySpotFleetRequestCommand,
} from '@aws-sdk/client-ec2';
import middy from '@middy/core';
import httpErrorHandlerMiddleware from '@middy/http-error-handler';
import httpJsonBodyParserMiddleware from '@middy/http-json-body-parser';
import inputOutputLoggerMiddleware from '@middy/input-output-logger';
import { createError } from '@middy/util';
import validatorMiddleware from '@middy/validator';
import { transpileSchema } from '@middy/validator/transpile';
import type { APIGatewayProxyResult } from 'aws-lambda';

import type { EventType } from '@/functions/common/interaction-event-schema';
import { eventSchema } from '@/functions/common/interaction-event-schema';
import {
    getEnv,
    getParameter,
    getServerName,
    respondToDiscord,
} from '@/functions/common/utils';
import checkMaintenanceModeMiddleware from '@/functions/handlers/server-command-handler/middlewares/check-maintenance-mode';

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

const getServerIpAddress = async (
    client: EC2Client,
    sfrId: string,
): Promise<string | void> => {
    const command = new DescribeSpotFleetInstancesCommand({
        SpotFleetRequestId: sfrId,
    });

    const response = await client.send(command);

    let instanceId: string | undefined = undefined;
    if (response.ActiveInstances !== undefined) {
        for (const instance of response.ActiveInstances) {
            if (instance.InstanceId !== undefined) {
                instanceId = instance.InstanceId;
                break;
            }
        }
    }

    if (typeof instanceId === 'string') {
        const command = new DescribeInstancesCommand({
            InstanceIds: [instanceId],
        });

        const response2 = await client.send(command);

        if (response2.Reservations) {
            for (const reservation of response2.Reservations) {
                if (reservation.Instances !== undefined) {
                    for (const instance of reservation.Instances) {
                        return instance.PublicIpAddress;
                    }
                }
            }
        }
    }
};

export const handleServerCommand = async (
    event: EventType,
): Promise<APIGatewayProxyResult> => {
    console.log('Start handling server command.');

    const data = event.body.data;
    if (data === undefined)
        throw createError(400, '"data" is required to start server.');

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
                const ipAddress = await getServerIpAddress(ec2Client, sfrId);
                await respondToDiscord(
                    discordApplicationId,
                    discordToken,
                    `🖥️🧟‍♂️サーバー[${serverName}]はすでに稼働中です👌${
                        typeof ipAddress === 'string'
                            ? `\n\nIPアドレス: \`${ipAddress}\`\nポート番号: \`26900\``
                            : ''
                    }`,
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

            await respondToDiscord(
                discordApplicationId,
                discordToken,
                `🖥️🧟‍♂️サーバー[${serverName}]の起動コマンドが実行されました👌`,
            );
        } catch (error) {
            await respondToDiscord(
                discordApplicationId,
                discordToken,
                `🖥️🧟‍♂️サーバー[${serverName}]の起動でエラーが発生しました😢\nしばらくしてからもう一度お試しください🙏`,
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
    .use(checkMaintenanceModeMiddleware())
    .use(httpErrorHandlerMiddleware())
    .handler(handleServerCommand);
