import { execSync } from 'child_process';

export const sshPublicKey = (): string => {
    const pubkey = process.env.SSH_PUB_KEY;
    if (pubkey !== undefined) {
        return pubkey;
    }

    // ssh-agentから取得
    const output = execSync('ssh-add -L|head -n 1')
        .toString()
        .replace(/\r?\n/g, '');
    if (output.length === 0) {
        throw new Error(`SSH_PUB_KEY environment variable not defined`);
    }
    return output;
};

export const getMyIP = (): string =>
    `${execSync('curl -s inet-ip.info').toString().replace(/\r?\n/g, '')}/32`;

export const getRequiredEnv = (key: string): string => {
    const env = process.env[key];
    if (env === undefined) {
        throw new Error(`'${key}' environment variable not defined`);
    }
    return env;
};
