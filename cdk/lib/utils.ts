import { execSync } from 'child_process';

export const getMyIP = (): string =>
    `${execSync('curl -s inet-ip.info').toString().replace(/\r?\n/g, '')}/32`;

export const getRequiredEnv = (key: string): string => {
    const env = process.env[key];
    if (env === undefined) {
        throw new Error(`'${key}' environment variable not defined`);
    }
    return env;
};
