import * as vscode from 'vscode';
import * as fs from "fs/promises";
import * as path from "path";
import { parse } from "jsonc-parser";
import { fileExists } from './util';

async function askToRestart() {
    const selection = await vscode.window.showInformationMessage(
        "Restart VS Code to apply the new settings?",
        { title: "Restart" },
        { title: "Cancel" },
    );

    if (selection?.title === "Restart") {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    }
}

function substitutePredefinedVars(workspaceFolder: vscode.WorkspaceFolder, value: string) {
    // FIXME: mb find a way to extract these variables from the vscode itself?
    const variables = {
        "${workspaceFolder}": workspaceFolder.uri.fsPath,
    };

    return Object.entries(variables).reduce((acc, [key, val]) => {
        return acc.replace(key, val);
    }, value);
}

const envVarsRe = /\$\{env:\w+\}/g;

function substituteEnvVariables(value: string) {
    const matches = value.match(envVarsRe);
    if (!matches) {
        return value;
    }
    
    return matches.reduce((result, envVar) => {
        const envVarName = envVar.slice(6, -1);

        const envVarValue = process.env[envVarName] || "";

        return result.replace(envVar, envVarValue);
    }, value);
}

function substituteVariables(workspaceFolder: vscode.WorkspaceFolder, value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((val) => substituteVariables(workspaceFolder, val));
    }

    if (typeof value === 'object' && value !== null) {
        return Object.entries(value).reduce((acc, [key, val]) => {
            return {
                ...acc,
                [key]: substituteVariables(workspaceFolder, val),
            };
        }, {});
    }

    if (typeof value !== 'string') {
        return value;
    }

    return substituteEnvVariables(substitutePredefinedVars(workspaceFolder, value));
}

export async function applyWorkspaceSettingsCmd() {
    vscode.workspace.workspaceFolders?.forEach(async (workspaceFolder) => {
        const settingsFile = path.join(workspaceFolder.uri.fsPath, ".vscode", "settings.json");
        const settingsFileExists = await fileExists(settingsFile);
        
        const settings = settingsFileExists
            ? parse(await fs.readFile(settingsFile, { encoding: "utf-8" }))
            : {};

        const workspaceSettingsFile = path.join(workspaceFolder.uri.fsPath, ".vscode", "settings.workspace.json");
        const workspaceSettingsFileExists = await fileExists(workspaceSettingsFile);

        const workspaceSettings = workspaceSettingsFileExists
            ? parse(await fs.readFile(workspaceSettingsFile, { encoding: "utf-8" }))
            : {};

        Object.entries(workspaceSettings).forEach(([key, val]) => {
            const value = substituteVariables(workspaceFolder, val);

            vscode.workspace.getConfiguration().update(key, value, vscode.ConfigurationTarget.WorkspaceFolder);

            settings[key] = value;
        });

        await fs.writeFile(settingsFile, JSON.stringify(settings, null, 4));
    });
    
    await askToRestart();
}
