import type { APIGatewayProxyEvent } from 'aws-lambda';
import { InteractionType } from 'discord-interactions';

// イベントの型
export interface EventType extends Omit<APIGatewayProxyEvent, 'body'> {
    body: InteractionBodyType;
}

export interface InteractionBodyType {
    id: string;
    token: string;
    applicationId: string;
    name: string;
    type: InteractionType;
    // Discordのパラメータ上ではオプショナルだが、コマンドの情報のために必須
    options: Array<ApplicationCommandInteractionDataOption>;
}

export interface ApplicationCommandInteractionDataOption {
    name: string;
    value?: string | number | boolean;
    options?: Array<ApplicationCommandInteractionDataOption>;
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
                token: {
                    type: 'string',
                },
                applicationId: {
                    type: 'string',
                },
                name: {
                    type: 'string',
                },
                type: {
                    $ref: '#/definitions/InteractionType',
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
                'token',
                'applicationId',
                'name',
                'type',
                // optionsはコマンドのオプション指定が必須なため必須とする
                'options',
            ],
        },
    },
    definitions: {
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
        InteractionType: {
            type: 'string',
            // 数字部分を配列にする
            // Object.values(Enum) --> [Key1, Key2, Value1, Value2]
            enum: Object.values(InteractionType).filter(
                (v) => !isNaN(Number(v)),
            ),
        },
    },
};
