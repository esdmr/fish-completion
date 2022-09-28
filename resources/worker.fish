set -g _started 0

function fish_prompt
    test $_started = 0
    and echo ready >&9
    and set -g _started 1
end

function _vscode_complete
    commandline (string unescape --style url -- "$argv")
    echo current (commandline -t) >&9

    for line in (complete -C)
        set content (string match -r '^.+?(?:\\t|$)' -- $line)

        switch "$content"
            case if for while break continue function return begin end and or not switch case
                printf 'complete %s\t' Keyword >&9
            case '$*'
                printf 'complete %s\t' Variable >&9
            case '*'
                set -l normalized (eval echo\ (string escape --style url -- $content) | string unescape --style url)

                if test -f "$normalized"
                    printf 'complete %s\t' File >&9
                else if test -d "$normalized"
                    printf 'complete %s\t' Folder >&9
                else if type -q "$content"
                    printf 'complete %s\t' Function >&9
                else
                    printf 'complete %s\t' Text >&9
                end
        end

        echo $line >&9
    end

    exit 0
end
