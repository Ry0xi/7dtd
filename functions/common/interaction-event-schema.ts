import type { APIGatewayProxyEvent } from 'aws-lambda';
import { InteractionType } from 'discord-interactions';

// 数字部分を配列にする
// Object.values(Enum) --> [Key1, Key2, Value1, Value2]
const numericEnumToArray = (values: unknown): number[] =>
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    Object.values(values).filter((v) => !isNaN(Number(v)));

// イベントの型
export interface EventType extends Omit<APIGatewayProxyEvent, 'body'> {
    body: InteractionBodyType;
}

export interface InteractionBodyType {
    id: string;
    application_id: string;
    type: InteractionType;
    token: string;
    // type: 1の時以外は存在する
    // https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-interaction-data
    data?: ApplicationCommandInteractionData;
}

export interface ApplicationCommandInteractionData {
    id: string;
    type: ApplicationCommandType;
    name: string;
    // Discordのパラメータ上ではオプショナルだが、コマンドの情報のために必須
    options: Array<ApplicationCommandInteractionDataOption>;
}

export interface ApplicationCommandInteractionDataOption {
    name: string;
    value: string | number | boolean;
    options?: Array<ApplicationCommandInteractionDataOption>;
}

// https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types
export enum ApplicationCommandType {
    CHAT_INPUT = 1,
    USER = 2,
    MESSAGE = 3,
}

// イベントのJSON Schema
// https://json-schema.org/
export const eventSchema = {
    type: 'object',
    required: ['body'],
    properties: {
        body: {
            type: 'object',
            // https://discord.com/developers/docs/interactions/receiving-and-responding
            properties: {
                id: {
                    type: 'string',
                },
                application_id: {
                    type: 'string',
                },
                type: {
                    type: 'number',
                    enum: numericEnumToArray(InteractionType),
                },
                token: {
                    type: 'string',
                },
                data: {
                    $ref: '#/definitions/ApplicationCommandInteractionData',
                },
            },
            required: ['id', 'application_id', 'type', 'token'],
        },
    },
    definitions: {
        // https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-object-application-command-data-structure
        ApplicationCommandInteractionData: {
            type: 'object',
            properties: {
                id: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                type: {
                    type: 'integer',
                    enum: numericEnumToArray(ApplicationCommandType),
                },
                options: {
                    type: 'array',
                    items: {
                        $ref: '#/definitions/ApplicationCommandInteractionDataOption',
                    },
                },
            },
            required: [
                'id',
                'name',
                'type',
                // optionsはコマンドのオプション指定が必須なため必須とする
                'options',
            ],
        },
        ApplicationCommandInteractionDataOption: {
            type: 'object',
            properties: {
                name: {
                    type: 'string',
                },
                value: {
                    oneOf: [
                        {
                            type: 'string',
                        },
                        {
                            type: 'number',
                        },
                        {
                            type: 'boolean',
                        },
                    ],
                },
                options: {
                    type: 'array',
                    items: {
                        $ref: '#/definitions/ApplicationCommandInteractionDataOption',
                    },
                },
            },
            // nameがあったらvalueも必須にしたいので、必須とする
            required: ['name', 'value'],
        },
    },
};
