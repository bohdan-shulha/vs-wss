import { exec } from "child_process";
import { promisify } from 'util';

const execAsync = promisify(exec);

const commandRe = /\$\(.+?\)/g;

function collectCommandsFromValue(value: string): Set<string> {
    const matches = value.match(commandRe);
    if (!matches) {
        return new Set();
    }

    return new Set(matches);
}

function collectCommands(value: unknown): Set<string> {
    if (Array.isArray(value)) {
        return new Set(...value.map((val) => collectCommands(val)));
    }

    if (typeof value === 'object' && value !== null) {
        return new Set(Object.values(value).reduce((acc, val) => {
            return [...acc, ...collectCommands(val)];
        }, []));
    }

    if (typeof value === 'string') {
        return collectCommandsFromValue(value);
    }

    return new Set();
}

async function executeCommands(commands: Set<string>): Promise<Map<string, string>> {
    const result = new Map();

    for (const command of commands) {
        const commandName = command.slice(2, -1);

        const proc = await execAsync(commandName);

        result.set(command, proc.stdout.trim());
    }

    return result;
}

function substituteCommandsInValue(value: unknown, commandResults: Map<string, string>): unknown {
    if (Array.isArray(value)) {
        return value.map((val) => substituteCommandsInValue(val, commandResults));
    }

    if (typeof value === 'object' && value !== null) {
        return Object.entries(value).reduce((acc, [key, val]) => {
            return {
                ...acc,
                [key]: substituteCommandsInValue(val, commandResults),
            };
        }, {});
    }

    if (typeof value !== 'string') {
        return value;
    }

    return Array.from(commandResults.entries()).reduce((acc, [command, result]) => {
        return acc.replace(command, result);
    }, value);
}

export async function substituteCommands(value: Record<string, unknown>): Promise<Record<string, unknown>> {
    const commands = collectCommands(value);
    if (commands.size === 0) {
        return value;
    }

    const commandResults = await executeCommands(commands);

    return Object.entries(value).reduce((acc, [key, val]) => {
        return {
            ...acc,
            [key]: substituteCommandsInValue(val, commandResults),
        };
    }, {});
}
