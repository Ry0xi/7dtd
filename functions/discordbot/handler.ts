import type {
    APIGatewayProxyEventV2,
    APIGatewayProxyHandlerV2,
    APIGatewayProxyResultV2,
} from 'aws-lambda';

const getEnv = (key: string): string => {
    const env = process.env[key];
    if (env === undefined) {
        throw new Error(`'$key' environment variable not defined`);
    }
    return env;
};

export const handler: APIGatewayProxyHandlerV2 = async (
    event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyResultV2> => {
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
