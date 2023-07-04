import * as vscode from 'vscode';
import * as path from "path";
import * as fs from "fs/promises";
import { parse } from "jsonc-parser";

export function initialize() {
    vscode.workspace.workspaceFolders?.forEach(async (workspaceFolder) => {
        vscode.window.showInformationMessage(
            `Initializing workspace folder ${workspaceFolder.name}...`,
        );

        const settingsFile = path.join(workspaceFolder.uri.fsPath, ".vscode", "settings.json");
        const workspaceSettingsFile = path.join(workspaceFolder.uri.fsPath, ".vscode", "settings.workspace.json");

        try {
            await fs.access(workspaceSettingsFile, fs.constants.R_OK | fs.constants.W_OK);
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : e;

            vscode.window.showErrorMessage(
                `Workspace ${workspaceFolder.name} settings file is not writeable: ${errorMessage}`,
            );
        }

        try {
            const settings = parse(await fs.readFile(settingsFile, { encoding: "utf-8" }));

            const workspaceSettings = parse(await fs.readFile(workspaceSettingsFile, { encoding: "utf-8" }));
            Object.entries(workspaceSettings).forEach(([key, val]) => {
                const value = typeof val === 'string' 
                    ? val.replace("${workspaceFolder}", workspaceFolder.uri.fsPath)
                    : val;
                    
                vscode.window.showInformationMessage(
                    `Setting ${key} to ${value}`,
                );

                vscode.workspace.getConfiguration().update(key, value, vscode.ConfigurationTarget.Workspace);

                settings[key] = value;
            });

            await fs.writeFile(settingsFile, JSON.stringify(settings, null, 4));
        } catch (e) {
            const errorMessage = e instanceof Error ? e.message : e;

            vscode.window.showErrorMessage(
                `Workspace ${workspaceFolder.name} settings file is not readable: ${errorMessage}`,
            );
        }

        vscode.window.showInformationMessage(
            "Restart VS Code to apply the new settings?",
            { title: "Restart" },
            { title: "Cancel" },
        ).then((selection) => {
            if (!selection || selection['title'] === 'Cancel') {
                return;
            }

            vscode.commands.executeCommand('workbench.action.reloadWindow');
        });
    });
}
