---
"fish-completion": minor
---

Add experimental assistant v1.

Look for lines starting with `function` and `set` to provide function name and
variable name completions.

It is quite limited in what it can detect, but I would say it is rather useful.

Note that, while I tried to minimize any potential attack vector, there may be
risk in running arbitrary commands to populate the fish shell completions.
Proceed with caution.
