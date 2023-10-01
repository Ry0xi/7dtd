import { InvokeCommand, LambdaClient, LogType } from '@aws-sdk/client-lambda';
import middy from '@middy/core';
import httpErrorHandlerMiddleware from '@middy/http-error-handler';
import httpHeaderNormalizerMiddleware from '@middy/http-header-normalizer';
import httpJsonBodyParserMiddleware from '@middy/http-json-body-parser';
import inputOutputLoggerMiddleware from '@middy/input-output-logger';
import validatorMiddleware from '@middy/validator';
import { transpileSchema } from '@middy/validator/transpile';
import { InvocationType } from 'aws-cdk-lib/triggers';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InteractionResponseType, InteractionType } from 'discord-interactions';

import {
    eventSchema,
    type EventType,
} from '@/functions/common/interaction-event-schema';
import { getEnv } from '@/functions/common/utils';
import discordAuthorizationMiddleware from '@/functions/handlers/discord-bot-handler/middlewares/discord-authorization';
import discordHandlePingMessageMiddleware from '@/functions/handlers/discord-bot-handler/middlewares/discord-handle-ping-message';

const invokeLambda = async (
    functionName: string,
    payload: string,
): Promise<void> => {
    const client = new LambdaClient();
    const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: payload,
        LogType: LogType.Tail,
        InvocationType: InvocationType.EVENT,
    });

    await client.send(command);
};

// サーバー操作のLambdaを起動する
export const handleInteraction = async (
    event: EventType & {
        // added by my middleware
        rawBody: string;
    },
): Promise<APIGatewayProxyResult> => {
    console.log('Start handling interaction.');

    if (event.body.type === InteractionType.APPLICATION_COMMAND) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore body(object)にrawBody(string)を入れるため
        event.body = event.rawBody;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore 余分なパラメータを送信しない & これ以降はrawBodyを使わないため
        delete event.rawBody;

        await invokeLambda(getEnv('CMDFUNC'), JSON.stringify(event));

        return {
            statusCode: 200,
            body: JSON.stringify({
                type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
            }),
            headers: {
                'Content-Type': 'application/json',
            },
        };
    }

    return {
        statusCode: 400,
        body: 'Not supported InteractionType.',
    };
};

export const handler = middy<
    APIGatewayProxyEvent & { rawBody: string | null }
>()
    .use(inputOutputLoggerMiddleware())
    .use(httpHeaderNormalizerMiddleware())
    // for discord-authorization
    .before((request) => {
        request.event.rawBody = request.event.body;
    })
    .use(httpJsonBodyParserMiddleware())
    .use(
        validatorMiddleware({
            eventSchema: transpileSchema(eventSchema, { coerceTypes: false }),
        }),
    )
    .use(discordAuthorizationMiddleware())
    .use(discordHandlePingMessageMiddleware())
    .use(httpErrorHandlerMiddleware())
    .handler(handleInteraction);
