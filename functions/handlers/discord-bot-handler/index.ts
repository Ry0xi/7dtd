import middy from '@middy/core';
import httpErrorHandlerMiddleware from '@middy/http-error-handler';
import httpHeaderNormalizerMiddleware from '@middy/http-header-normalizer';
import httpJsonBodyParserMiddleware from '@middy/http-json-body-parser';
import inputOutputLoggerMiddleware from '@middy/input-output-logger';
import validatorMiddleware from '@middy/validator';
import { transpileSchema } from '@middy/validator/transpile';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import type { EventType } from '@/functions/common/interaction-event-schema';
import { eventSchema } from '@/functions/common/interaction-event-schema';
import { getEnv } from '@/functions/common/utils';
import discordAuthorizationMiddleware from '@/functions/handlers/discord-bot-handler/middlewares/discord-authorization';
import discordHandlePingMessageMiddleware from '@/functions/handlers/discord-bot-handler/middlewares/discord-handle-ping-message';

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
