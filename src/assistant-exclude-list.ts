export const variableExcludeList = new Set([
	'argv',
	'CMD_DURATION',
	'COLUMNS',
	'fish_bind_mode',
	'fish_color_autosuggestion',
	'fish_color_cancel',
	'fish_color_command',
	'fish_color_comment',
	'fish_color_cwd',
	'fish_color_cwd_root',
	'fish_color_end',
	'fish_color_error',
	'fish_color_escape',
	'fish_color_hg_added',
	'fish_color_hg_clean',
	'fish_color_hg_copied',
	'fish_color_hg_deleted',
	'fish_color_hg_dirty',
	'fish_color_hg_modified',
	'fish_color_hg_renamed',
	'fish_color_hg_unmerged',
	'fish_color_hg_untracked',
	'fish_color_history_current',
	'fish_color_host',
	'fish_color_host_remote',
	'fish_color_match',
	'fish_color_normal',
	'fish_color_operator',
	'fish_color_param',
	'fish_color_quote',
	'fish_color_redirection',
	'fish_color_search_match',
	'fish_color_selection',
	'fish_color_status',
	'fish_color_user',
	'fish_color_valid_path',
	'fish_complete_path',
	'fish_function_path',
	'fish_greeting',
	'fish_key_bindings',
	'fish_pager_color_completion',
	'fish_pager_color_description',
	'fish_pager_color_prefix',
	'fish_pager_color_progress',
	'fish_pid',
	'fish_prompt_hg_status_added',
	'fish_prompt_hg_status_copied',
	'fish_prompt_hg_status_deleted',
	'fish_prompt_hg_status_modified',
	'fish_prompt_hg_status_order',
	'fish_prompt_hg_status_unmerged',
	'fish_prompt_hg_status_untracked',
	'FISH_VERSION',
	'history',
	'hostname',
	'IFS',
	'LINES',
	'pipestatus',
	'status',
	'umask',
	'version',
	// Worker specific excluded items:
	'TERM',
	'_FISH_COMPLETION_ASSIST',
	'_FISH_COMPLETION_TEMP_DIR',
	'_FISH_COMPLETION_WORKER',
	'__worker_old_status',
	'__worker_completions',
	'__worker_line',
	'__worker_content',
	'__worker_type',
	'__worker_normalized',
]);

export const functionExcludeList = new Set([
	'fish',
	'fish_indent',
	'fish_update_completions',
	'function',
	'while',
	'if',
	'else',
	'switch',
	'case',
	'for',
	'in',
	'begin',
	'end',
	'continue',
	'break',
	'return',
	'source',
	'exit',
	'wait',
	'and',
	'or',
	'not',
	'eval',
	'echo',
	'printf',
	'set',
	'status',
	'test',
	'[',
	'[[',
	'commandline',
	'bind',
	// Worker specific excluded items:
	'__worker_trace',
	'__worker_complete',
	'__worker_update',
]);