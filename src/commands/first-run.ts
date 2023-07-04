import * as vscode from 'vscode';

export function checkFirstRun() {
    const isFirstRun = !vscode.workspace.getConfiguration("wss").get<string>('workspaceHash');

    if (!isFirstRun) {
        return;
    }

    vscode.window.showInformationMessage(
        "Welcome to the Workspace Settings Sync extension! Please select an option below.",
        { title: "Initialize" },
        { title: "Cancel" }
    )
        .then((selection) => {
            if (!selection || selection['title'] === 'Cancel') {
                return;
            }

            vscode.commands.executeCommand('wss.initialize');
        });
}
