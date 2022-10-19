# Porting to other editors

The sections below document how this extension works, specially to port it to
other editors. If you have any questions or suggestions about the following
sections, please visit the [‘Ports’ Discussions on GitHub][ports].

[ports]: https://github.com/esdmr/fish-completion/discussions/categories/ports

## [`worker.fish`](resources/worker.fish)

This script handles the fish shell side of the completions.

The tenth channel (index 9) of the process is the output channel. The script
does **not** send anything to stdout/stderr.

The `_dir` variable should refer to a temporary directory.

It sends the string `ready` to the output channel when fish shell finishes
processing the config files and prints the first prompt.

It registers the `e` key bind to query the completions.
Unfortunately, `fish_prompt` cannot set the `commandline`, so once it sends the
string `ready`, the extension should send the character `e` to the stdin.

It reads the `commandline` from `$_dir/text`. The extension should write the
text content up to the cursor to this directory.

The script will send the current token to the output channel according to the
following format. The extension uses this to determine what to erase before
inserting the completions.

```plain
current %s\n
```

The script sends the completion entries to the output channel according to the
following format:

```plain
complete %s\t%s\n     (without description)
complete %s\t%s\t%s\n    (with description)
```

The first field is the generated type of entry, the second field is the content
(which may not contain a horizontal tab), and the optional third
field is the description.

The type of entry may be: `Text`, `Keyword`, `Variable`, `File`, `Folder`, or
`Function`. Any unknown type should be regarded as `Text`.

Since the script is one-shot, it will end once it sends all the entries.

## [`fish.ts`](src/fish.ts)

Initially, it creates a temporary directory. The extension should remove it
later.

It also prepares a script to run:

```sh
script -e -q -c "fish -iPC 'bootstrap'" /dev/null
```

where `bootstrap` is:

```fish
set -g _dir "$_FISH_COMPLETION_TEMP_DIR"
source "$_FISH_COMPLETION_WORKER"
```

It then spawns the script with `TERM=dumb`, `_FISH_COMPLETION_TEMP_DIR=` path to
the temporary directory, and `__FISH_COMPLETION_WORKER=` path to the worker
script. It should receive the stdin and output channels as a stream. (For
debugging purposes, it also pipes the stdout and stderr.)

Once `ready` was received on the output channel, it will send `e` to stdin.

By collecting every line on the output channel starting with `current` or
`complete`, the extension can provide the completion entries to the editor.

## Updating completions

Since the extension uses fish completions, it may provide a command to run
`fish_update_completions` for convenience.

The extension may parse the output of `fish_update_completions` and show the
progress to the user. If not, the extension should either show the live output,
or notify when the command finishes.
