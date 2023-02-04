function fish_prompt
    echo ready >&9

    function fish_prompt
        # Empty
    end
end

function __worker_trace
    set __worker_old_status $status
    status stack-trace >&9
    return $__worker_old_status
end

function __worker_complete
    set -q _FISH_COMPLETION_TEMP_DIR || exit (__worker_trace)

    # Experimental assistant v1
    test "$_FISH_COMPLETION_ASSIST" = v1
    and begin
        source $_FISH_COMPLETION_TEMP_DIR/cmd || return (__worker_trace)
    end

    commandline (cat $_FISH_COMPLETION_TEMP_DIR/text) || return (__worker_trace)
    echo current (commandline -t) >&9 || return (__worker_trace)
    set __worker_completions (complete -C --escape) || return (__worker_trace)
    commandline '' || return (__worker_trace)

    for __worker_line in $__worker_completions
        set -l __worker_content (string match -r '^.+?(?=\\t|$)' -- $__worker_line) || return (__worker_trace)
        set -l __worker_type Text

        switch "$__worker_content"
            case if for while break continue function return begin end and or not switch case
                set __worker_type Keyword
            case '$*'
                set __worker_type Variable
            case '*'
                set -l __worker_normalized (eval echo\ --\ (string escape --style url -- $__worker_content) | string unescape --style url) || return (__worker_trace)

                if test -f "$__worker_normalized"
                    set __worker_type File
                else if test -d "$__worker_normalized"
                    set __worker_type Folder
                else if type -q -- "$__worker_content"
                    set __worker_type Function
                end
        end

        printf 'complete %s\t%s\n' "$__worker_type" "$__worker_line" >&9
    end

    return 0
end

function __worker_update
    fish_update_completions >&9 || __worker_trace
end

bind e '__worker_complete; exit'
bind u '__worker_update; exit'
