import type middy from '@middy/core';
import { createError } from '@middy/util';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { verifyKey } from 'discord-interactions';

import type { EventType } from '@/functions/common/interaction-event-schema';
import { getEnv, getParameter } from '@/functions/common/utils';

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
        const headers = request.event.headers;
        const signature = headers['x-signature-ed25519'];
        const timestamp = headers['x-signature-timestamp'];
        const publicKey = await getParameter(
            `/${getEnv('PREFIX')}/${getEnv('SERVER_NAME')}/discordPublicKey`,
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
