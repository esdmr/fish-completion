set -g _started 0

function fish_prompt
    test $_started = 0
    and echo ready >&9
    and set -g _started 1
end

function _vscode_complete
    commandline (string unescape --style url -- "$argv")
    echo current (commandline -t) >&9

    for line in (complete -C --escape)
        set -l content (string match -r '^.+?(?=\\t|$)' -- $line)
        set -l type Text

        switch "$content"
            case if for while break continue function return begin end and or not switch case
                set type Keyword
            case '$*'
                set type Variable
            case '*'
                set -l normalized (eval echo\ --\ (string escape --style url -- $content) | string unescape --style url)

                if test -f "$normalized"
                    set type File
                else if test -d "$normalized"
                    set type Folder
                else if type -q -- "$content"
                    set type Function
                end
        end

        printf 'complete %s\t%s\n' "$type" "$line" >&9
    end

    exit 0
end
