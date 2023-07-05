import * as vscode from 'vscode';
import { askToInitialize, isFirstRun } from './activate';
import { initialize } from './initialize';
import { applyWorkspaceSettingsCmd } from './settings';

export function activate(context: vscode.ExtensionContext) {
	if (isFirstRun() && vscode.workspace.workspaceFolders?.length) {
		askToInitialize();	
	}

	Object.entries({
		"wss.initialize": initialize,
		"wss.applyWorkspaceSettings": applyWorkspaceSettingsCmd,
	}).forEach(([command, handler]) => {
		const disposable = vscode.commands.registerCommand(command, handler);

		context.subscriptions.push(disposable);
	});
}

// This method is called when your extension is deactivated
export function deactivate() {}
