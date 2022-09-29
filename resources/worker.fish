function fish_prompt
    echo ready >&9

    function fish_prompt
        # Empty
    end
end

function _trace
    set old_status $status
    status stack-trace >&9
    return $old_status
end

set -q _dir || exit (_trace)

function _complete
    commandline (cat $_dir/text) || return (_trace)
    echo current (commandline -t) >&9 || return (_trace)
    set completions (complete -C --escape) || return (_trace)
    commandline '' || return (_trace)

    for line in $completions
        set -l content (string match -r '^.+?(?=\\t|$)' -- $line) || return (_trace)
        set -l type Text

        switch "$content"
            case if for while break continue function return begin end and or not switch case
                set type Keyword
            case '$*'
                set type Variable
            case '*'
                set -l normalized (eval echo\ --\ (string escape --style url -- $content) | string unescape --style url) || return (_trace)

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

    return 0
end

bind e '_complete; exit'
