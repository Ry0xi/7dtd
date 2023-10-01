import type middy from '@middy/core';
import { createError } from '@middy/util';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { verifyKey } from 'discord-interactions';

import type { EventType } from '@/functions/common/interaction-event-schema';
import { getEnv, getParameter } from '@/functions/common/utils';

const discordAuthorizationMiddleware = (): middy.MiddlewareObj<
    EventType,
    APIGatewayProxyResult
> => {
    /**
     * Discord Authorization
     *
     * @see https://discord.com/developers/docs/interactions/receiving-and-responding#security-and-authorization
     */
    const discordAuthorizationMiddlewareBefore: middy.MiddlewareFn<
        EventType,
        APIGatewayProxyResult
    > = async (request): Promise<APIGatewayProxyResult | void> => {
        const headers = request.event.headers;
        const signature = headers['x-signature-ed25519'];
        const timestamp = headers['x-signature-timestamp'];
        const publicKey = await getParameter(
            `/${getEnv('PREFIX')}/${getEnv('SERVER_NAME')}/discordPublicKey`,
        );

        console.log('signature:', signature);
        console.log('timestamp:', timestamp);
        console.log('publicKey:', publicKey);
        console.log('rawBody:', request.event.rawBody);

        if (
            !signature ||
            !timestamp ||
            !publicKey ||
            !verifyKey(request.event.rawBody, signature, timestamp, publicKey)
        ) {
            throw createError(401, 'discord authorization failed.');
        }
    };

    return {
        before: discordAuthorizationMiddlewareBefore,
    };
};

export default discordAuthorizationMiddleware;
