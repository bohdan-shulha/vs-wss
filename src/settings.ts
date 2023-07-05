import * as vscode from 'vscode';
import * as fs from "fs/promises";
import * as path from "path";
import { parse } from "jsonc-parser";
import { fileExists } from './util';
import { substituteCommands } from './substitute/commands';

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

function substituteVariablesInValue(workspaceFolder: vscode.WorkspaceFolder, value: unknown): unknown {
    if (Array.isArray(value)) {
        return value.map((val) => substituteVariablesInValue(workspaceFolder, val));
    }

    if (typeof value === 'object' && value !== null) {
        return Object.entries(value).reduce((acc, [key, val]) => {
            return {
                ...acc,
                [key]: substituteVariablesInValue(workspaceFolder, val),
            };
        }, {});
    }

    if (typeof value !== 'string') {
        return value;
    }

    return substituteEnvVariables(substitutePredefinedVars(workspaceFolder, value));
}

function substituteVariables(workspaceFolder: vscode.WorkspaceFolder, settings: Record<string, unknown>): Record<string, unknown> {
    return Object.entries(settings).reduce((acc, [key, val]) => {
        return {
            ...acc,
            [key]: substituteVariablesInValue(workspaceFolder, val),
        };
    }, {});
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

        const workspaceSettingsWithVars = substituteVariables(workspaceFolder, workspaceSettings);

        try {
            const workspaceSettingsWithCommands = await substituteCommands(workspaceSettingsWithVars);

            Object.entries(workspaceSettingsWithCommands).forEach(([key, value]) => {    
                vscode.workspace.getConfiguration("settings", workspaceFolder).update(key, value, vscode.ConfigurationTarget.WorkspaceFolder);
    
                settings[key] = value;
            });
    
            await fs.writeFile(settingsFile, JSON.stringify(settings, null, 4));
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : JSON.stringify(e);

            vscode.window.showErrorMessage(`Failed to apply workspace settings: ${errorMessage}`);
        }
    });
    
    // FIXME: check if any settings were changed and ask to restart only in this case
    await askToRestart();
}
