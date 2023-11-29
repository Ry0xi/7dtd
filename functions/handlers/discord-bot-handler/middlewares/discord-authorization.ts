import type middy from '@middy/core';
import { createError } from '@middy/util';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { verifyKey } from 'discord-interactions';

import type { EventType } from '@/functions/common/interaction-event-schema';
import { getEnv, getParameter, getServerName } from '@/functions/common/utils';

const discordAuthorizationMiddleware = (): middy.MiddlewareObj<
    EventType & {
        // added by my middleware
        rawBody: string;
    },
    APIGatewayProxyResult
> => {
    /**
     * Discord Authorization
     *
     * @see https://discord.com/developers/docs/interactions/receiving-and-responding#security-and-authorization
     */
    const discordAuthorizationMiddlewareBefore: middy.MiddlewareFn<
        EventType & {
            // added by my middleware
            rawBody: string;
        },
        APIGatewayProxyResult
    > = async (request): Promise<APIGatewayProxyResult | void> => {
        const data = request.event.body.data;
        if (data === undefined)
            throw createError(400, '"data" is required to start server.');
        const serverName = getServerName(data);

        const headers = request.event.headers;
        const signature = headers['x-signature-ed25519'];
        const timestamp = headers['x-signature-timestamp'];
        const publicKey = await getParameter(
            `/${getEnv('PREFIX')}/${serverName}/discordPublicKey`,
        );

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
