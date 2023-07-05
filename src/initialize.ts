import * as vscode from 'vscode';
import * as path from "path";
import * as fs from "fs/promises";
import { fileExists } from './util';

export async function initialize() {
    const workspaceFoldersInit = (vscode.workspace.workspaceFolders || []).map(async (workspaceFolder) => {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Initializing workspace folder ${workspaceFolder.name}...`,
            cancellable: false,
        }, async () => {
            const settingsFile = path.join(workspaceFolder.uri.fsPath, ".vscode", "settings.json");
            const settingsFileExists = await fileExists(settingsFile);
    
            const workspaceSettingsFile = path.join(workspaceFolder.uri.fsPath, ".vscode", "settings.workspace.json");
    
            if (settingsFileExists) {
                if (await fileExists(workspaceSettingsFile)) {
                    const response = await vscode.window.showInformationMessage(
                        `Workspace settings file already exists in ${workspaceFolder.name}. Do you want to overwrite it with settings.json?`,
                        { title: "Yes, overwrite" },
                        { title: "No" },
                    );
    
                    if (response?.title === "Yes, overwrite") {
                        await fs.unlink(workspaceSettingsFile);
                        await fs.rename(settingsFile, workspaceSettingsFile);
                    }
                } else {
                    await fs.rename(settingsFile, workspaceSettingsFile);
                }
            }
        });
    });

    await Promise.all(workspaceFoldersInit);

    await vscode.commands.executeCommand('wss.applyWorkspaceSettings');
}
