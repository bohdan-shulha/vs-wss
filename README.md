# Workspace Shared Settings

## Features

- Have you ever need to use ${workspaceFolder} in your settings.json?
- Were you struggling to share settings with your team?
- Do you have multiple devices running different OSes and you need the same settings everywhere?

This extension is an answer to all these questions.

The long-awaited feature (since 2016 - [issue](https://github.com/Microsoft/vscode/issues/2809)) is finally here!

## Extension Settings

This extension contributes the following settings:

- none at the moment. :)

## Known Issues

This is just a proof of concept, but it already works as of today. PRs are welcome.

## Release Notes

### 0.0.2

- Added a separate command to apply settings from `settings.workspace.json`.

### 0.0.1

- Initial release of the extension - just a proof of concept.

## TODO

- Add more substitutions.
- Add environment variables substitutions.
- Ask to apply new workspace settings after changing/syncing the settings.workspace.json file.
- Add support for `workspace.local.json` (or `settings.local.json`) file, so that you don't need multiple extensions doing the same job.
- Show .gitignore recommendations.
- I18n.
- Tests.
