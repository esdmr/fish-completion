# Changelog

## 0.2.2

### Patch Changes

- e8fc5de: Lift the requirement for fish path
- e8fc5de: Improve logging and error handling
- 5d5d261: Replace vsce with @vscode/vsce
- ea8d78c: Enable log mode for the output. You can use `Developer: Set log level…` to customize its verbosity.

## 0.2.1

### Patch Changes

- 4c25c29: Fix workers in macOS and FreeBSD

## 0.2.0

### Minor Changes

- a9ff669: Customizable fish path
- 2239e70: Add experimental assistant v1.

  Look for lines starting with `function` and `set` to provide function name and
  variable name completions.

  It is quite limited in what it can detect, but I would say it is rather useful.

  Note that, while I tried to minimize any potential attack vector, there may be
  risk in running arbitrary commands to populate the fish shell completions.
  Proceed with caution.

- 25f5c98: Bump minimum VSCode version to 1.75.0

### Patch Changes

- f28eea2: Refactor

## 0.1.0

### Minor Changes

- aad2b84: Add `fish_update_completions` command (#12)

## 0.0.2

### Patch Changes

- Some clean up.
- Update README.
- Add an icon.

## 0.0.1

### Patch Changes

- Initial release
