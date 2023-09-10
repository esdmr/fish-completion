# Fish completion for VS Code

[![License](https://img.shields.io/github/license/esdmr/fish-completion?labelColor=0F0F0F&color=005C9A)][License]
[![VS Code version](https://img.shields.io/badge/VSCode-≥1.75.0-005C9A?labelColor=0F0F0F&logo=Visual%20Studio%20Code&logoColor=007ACC)][VS Code]

[License]: https://github.com/esdmr/fish-completion/blob/main/LICENSE
[VS Code]: https://code.visualstudio.com/Download
[Node.js]: https://nodejs.org/en/download/current
[`script`]: https://www.man7.org/linux/man-pages/man1/script.1.html

Native fish shell completion in VS Code intellisense

Editing large scripts or functions in fish is less ergonomic compared to a
proper Text Editor™. However, editors (such as VS Code) either do not provide
command completions or do not integrate with the built-in completions of fish.

This extension queries fish shell completions directly. The extension provides
The text in the editor to `commandline` and then `complete -C` provides it with
a list of completions and descriptions.

> **Note**: There is an experimental variable and function completion in v0.2. You
> can enable it in settings at `fish-completion.assistant.v1.enabled`.

## Requirements

- [`script`][] executable in `$PATH` (to fake a TTY),
- `/dev/null` (to dispose of the `typescript` of `script`),
- Working fish shell installation.

## Installing from source

This project requires [Node.js][] version 16 minimum. Ensure that you have
installed the correct version of Node.js by running `node --version`.

The following snippet will download, install, and build the source from GitHub:

```sh
git clone https://github.com/esdmr/fish-completion.git
cd fish-completion
corepack pnpm install
corepack pnpm run build
```

After building, you can either use VS Code to launch it or run
`corepack pnpm run package` to generate a `vsix` file.

## Porting to other editors

See [Porting to other editors](PORT.md).
