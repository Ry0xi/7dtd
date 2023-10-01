import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

export const getEnv = (key: string): string => {
    const env = process.env[key];
    if (env === undefined) {
        throw new Error(`'${key}' environment variable not defined`);
    }
    return env;
};

export const getParameter = async (keyName: string): Promise<string> => {
    const ssmClient = new SSMClient();
    const command = new GetParameterCommand({
        Name: keyName,
    });

    const response = await ssmClient.send(command);
    return response.Parameter!.Value!;
};
