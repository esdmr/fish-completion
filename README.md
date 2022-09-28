# Fish completion for VSCode

[![License](https://img.shields.io/github/license/esdmr/fish-completion?labelColor=0F0F0F&color=005C9A)][license]
[![VSCode version](https://img.shields.io/badge/VSCode-≥1.65.0-005C9A?labelColor=0F0F0F&logo=Visual%20Studio%20Code&logoColor=007ACC)][vscode]

[license]: https://github.com/esdmr/fish-completion/blob/master/LICENSE
[vscode]: https://nodejs.org/en/download/current
[node]: https://nodejs.org/en/download/current

Native fish shell completion in VSCode intellisense.

## Installing from source

This project requires [Node.JS][node] version 16 minimum. Ensure that you have
installed the correct version of Node.JS by running `node --version`.

The following snippet will download, install, and build the source from GitHub:

```sh
git clone https://github.com/esdmr/fish-completion.git
cd fish-completion
corepack pnpm install
corepack pnpm run build
```

After building, you can use VSCode to launch it.
