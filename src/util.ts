import * as vscode from 'vscode';
import * as path from "path";
import * as fs from "fs/promises";

export async function fileExists(filePath: string) {
    try {
        await fs.access(filePath);

        return true;
    } catch (e) {
        console.warn(e);

        return false;
    }
}
