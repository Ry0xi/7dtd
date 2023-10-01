import middy from '@middy/core';
import httpErrorHandlerMiddleware from '@middy/http-error-handler';
import httpHeaderNormalizerMiddleware from '@middy/http-header-normalizer';
import httpJsonBodyParserMiddleware from '@middy/http-json-body-parser';
import validatorMiddleware from '@middy/validator';
import { transpileSchema } from '@middy/validator/transpile';
import type { APIGatewayProxyResult } from 'aws-lambda';

import type { EventType } from '@/functions/common/interaction-event-schema';
import { eventSchema } from '@/functions/common/interaction-event-schema';
import discordHandlePingMessageMiddleware from '@/functions/handlers/discord-bot-handler/middlewares/discord-handle-ping-message';

const getEnv = (key: string): string => {
    const env = process.env[key];
    if (env === undefined) {
        throw new Error(`'$key' environment variable not defined`);
    }
    return env;
};

export const handleInteraction = async (
    event: EventType,
): Promise<APIGatewayProxyResult> => {
    // TODO: Discordのリクエストのハンドリングを行い、サーバーコマンドのLambdaを起動する
    console.log('discordbot');
    console.log('PREFIX:', getEnv('PREFIX'));
    console.log('CMDFUNC:', getEnv('CMDFUNC'));
    console.log(event);

    return {
        statusCode: 200,
        body: '',
    };
};

export const handler = middy()
    .use(httpHeaderNormalizerMiddleware())
    .use(httpJsonBodyParserMiddleware())
    .use(
        validatorMiddleware({
            eventSchema: transpileSchema(eventSchema, { coerceTypes: false }),
        }),
    )
    .use(discordHandlePingMessageMiddleware())
    .use(httpErrorHandlerMiddleware())
    .handler(handleInteraction);
