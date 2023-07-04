import * as vscode from 'vscode';

export function isFirstRun() {
    return !vscode.workspace.getConfiguration("wss").get<string>('workspaceHash');
}

export async function askToInitialize() {
    const selection = await vscode.window.showInformationMessage(
        "Welcome to the Workspace Shared Settings extension! Please select an option below.",
        { title: "Initialize" },
        { title: "Cancel" }
    );

    if (selection?.title === 'Initialize') {
        vscode.commands.executeCommand('wss.initialize');
    }
}
