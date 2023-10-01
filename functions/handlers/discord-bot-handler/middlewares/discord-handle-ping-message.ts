import type middy from '@middy/core';
import type { APIGatewayProxyResult } from 'aws-lambda';
import { InteractionType } from 'discord-interactions';

import type { EventType } from '@/functions/common/interaction-event-schema';

const discordHandlePingMessageMiddleware = (): middy.MiddlewareObj<
    EventType,
    APIGatewayProxyResult
> => {
    /**
     * PING - PONG
     *
     * @see https://discord.com/developers/docs/interactions/receiving-and-responding#receiving-an-interaction
     */
    const discordHandlePingMessageMiddlewareBefore: middy.MiddlewareFn<
        EventType,
        APIGatewayProxyResult
    > = async (request): Promise<APIGatewayProxyResult | void> => {
        const interactionType = request.event.body.type;

        if (interactionType === InteractionType.PING) {
            return {
                statusCode: 200,
                body: JSON.stringify({
                    type: InteractionType.PING,
                }),
                headers: {
                    'Content-Type': 'application/json',
                },
            };
        }
    };

    return {
        before: discordHandlePingMessageMiddlewareBefore,
    };
};

export default discordHandlePingMessageMiddleware;
