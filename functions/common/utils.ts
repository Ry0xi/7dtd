import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

import type { ApplicationCommandInteractionData } from '@/functions/common/interaction-event-schema';

export const getEnv = (key: string): string => {
    const env = process.env[key];
    if (env === undefined) {
        throw new Error(`'${key}' environment variable not defined`);
    }
    return env;
};

export const getServerName = (
    data: ApplicationCommandInteractionData,
): string => {
    for (const option of data.options) {
        if (option.name === 'server' && typeof option.value === 'string') {
            return option.value;
        }
    }

    return '';
};

export const getParameter = async (keyName: string): Promise<string> => {
    const ssmClient = new SSMClient();
    const command = new GetParameterCommand({
        Name: keyName,
    });

    const response = await ssmClient.send(command);
    return response.Parameter!.Value!;
};

export const respondToDiscord = async (
    applicationId: string,
    token: string,
    content: string,
): Promise<void> => {
    const url = `https://discord.com/api/v10/webhooks/${applicationId}/${token}`;

    const params = {
        method: 'POST',
        body: JSON.stringify({
            content: content,
        }),
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const response = await fetch(url, params);

    if (!response.ok) {
        console.warn('Could not post to discord. message:', content);
        console.warn('response', await response.json());
    }
};
