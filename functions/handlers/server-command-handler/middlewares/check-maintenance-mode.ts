import type middy from '@middy/core';
import { createError } from '@middy/util';
import type { APIGatewayProxyResult } from 'aws-lambda';

import type { EventType } from '@/functions/common/interaction-event-schema';
import {
    getEnv,
    getParameter,
    getServerName,
    respondToDiscord,
} from '@/functions/common/utils';

/**
 * サーバーがメンテナンスモードかどうか確認するミドルウェア
 */
const checkMaintenanceModeMiddleware = (): middy.MiddlewareObj<
    EventType,
    APIGatewayProxyResult
> => {
    const checkMaintenanceModeMiddlewareBefore: middy.MiddlewareFn<
        EventType,
        APIGatewayProxyResult
    > = async (request): Promise<APIGatewayProxyResult | void> => {
        const maintenance = await getParameter(
            `/${getEnv('PREFIX')}/${getEnv('SERVER_NAME')}/maintenance`,
        );

        if (maintenance === 'true') {
            const data = request.event.body.data;
            if (data === undefined)
                throw createError(400, '"data" is required to start server.');

            const serverName = getServerName(data);
            const discordApplicationId = request.event.body.application_id;
            const discordToken = request.event.body.token;

            await respondToDiscord(
                discordApplicationId,
                discordToken,
                `🖥️🧟‍♂️サーバー[${serverName}]はメンテナンス中です👷🚧`,
            );

            throw createError(
                503,
                `Server ${serverName} is currently under maintenance.`,
            );
        }
    };

    return {
        before: checkMaintenanceModeMiddlewareBefore,
    };
};

export default checkMaintenanceModeMiddleware;
