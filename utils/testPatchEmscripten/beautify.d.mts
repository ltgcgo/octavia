/** A quick and dirty file to get IDE prompts. License follows the original project, since I didn't either design or reverse-engineer this. Maybe a soft fork to get rid of CommonJS and UMD, and add proper ESM, I dunno?
* @license MIT
* @module io.github.beautifier.js-beautify */

/** Why does this exist? */
declare type StringifiedInteger = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8";

declare interface BeautifierSettingsCore {
	disabled: boolean;
	end_with_newline: boolean;
	indent_char: string;
	indent_empty_lines: boolean;
	indent_size: StringifiedInteger;
	max_preserve_newlines: StringifiedInteger;
	preserve_newlines: boolean;
	wrap_line_length: StringifiedInteger;
}

export interface BeautifierSettingsJS extends BeautifierSettingsCore {
	brace_style: "collapse"|"expand"|"end-expand"|"none";
	break_chained_methods: boolean;
	comma_first: boolean;
	e4x: boolean;
	jslint_happy: boolean;
	keep_array_indentation: boolean;
	space_before_conditional: boolean;
	unescape_strings: boolean;
}

export class Beautifier {
	js(data: string, config: BeautifierSettingsJS): string;
}