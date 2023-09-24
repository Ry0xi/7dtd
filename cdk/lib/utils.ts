import { execSync } from "child_process";

export const getMyIP = (): string => `${execSync("curl -s inet-ip.info").toString().replace(/\r?\n/g, '')}/32`;