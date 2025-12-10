import yargs from 'yargs';
import { green, red } from 'colorette';

import { CompilerType } from '../compilers/compiler.interface.js';
import { normalizePaths } from '../utils/fs-helpers.js';
import { CliArguments } from '../utils/utils.js';
import { NgxTranslateExtract } from '../_extractors/ngx-translate-extract.js';

// First parsing pass to be able to access pattern argument for use input/output arguments
const y = yargs().option('patterns', {
	alias: 'p',
	describe: 'Default patterns',
	type: 'array',
	default: ['/**/*.html', '/**/*.ts'],
	string: true,
	hidden: true,
});

const parsed = await y.parse();

const options: CliArguments = await y
	.usage('Extract strings from files for translation.\nUsage: $0 [options]')
	.version(process.env.npm_package_version)
	.alias('version', 'v')
	.help('help')
	.alias('help', 'h')
	.option('input', {
		alias: 'i',
		describe: 'Paths you would like to extract strings from. You can use path expansion, glob patterns and multiple paths',
		default: [process.env.PWD],
		type: 'array',
		normalize: true,
		demandOption: true,
	})
	.coerce('input', (input: string[]) => normalizePaths(input, parsed.patterns))
	.option('output', {
		alias: 'o',
		describe: 'Paths where you would like to save extracted strings. You can use path expansion, glob patterns and multiple paths',
		type: 'array',
		normalize: true,
		demandOption: true,
	})
	.coerce('output', (output: string[]) => normalizePaths(output, parsed.patterns))
	.option('format', {
		alias: 'f',
		describe: 'Format',
		default: CompilerType.Json,
		choices: [CompilerType.Json, CompilerType.NamespacedJson, CompilerType.Pot],
	})
	.option('format-indentation', {
		alias: 'fi',
		describe: 'Format indentation (JSON/Namedspaced JSON)',
		default: '\t',
		type: 'string',
	})
	.option('replace', {
		alias: 'r',
		describe: 'Replace the contents of output file if it exists (Merges by default)',
		type: 'boolean',
	})
	.option('sort', {
		alias: 's',
		describe: 'Sort strings in alphabetical order',
		type: 'boolean',
	})
	.option('sort-original-order', {
		alias: 'soo',
		describe: 'Sort only extracted values and adds them into the order of the original translations file',
		type: 'boolean',
	})
	.option('sort-sensitivity', {
		alias: 'ss',
		describe: 'Sort sensitivitiy of strings (only to be used when sorting)',
		type: 'string',
		choices: ['base', 'accent', 'case', 'variant'],
		default: undefined,
	})
	.option('po-source-locations', {
		describe: 'Include file location comments in .po files',
		type: 'boolean',
		default: true,
	})
	.option('clean', {
		alias: 'c',
		describe: 'Remove obsolete strings after merge',
		type: 'boolean',
	})
	.option('cache-file', {
		describe: 'Cache parse results to speed up consecutive runs',
		type: 'string',
	})
	.option('marker', {
		alias: 'm',
		describe: 'Name of a custom marker function for extracting strings',
		type: 'string',
		default: undefined,
	})
	.option('key-as-default-value', {
		alias: 'k',
		describe: 'Use key as default value',
		type: 'boolean',
		conflicts: ['key-as-initial-default-value', 'null-as-default-value', 'string-as-default-value'],
	})
	.option('key-as-initial-default-value', {
		alias: 'ki',
		describe: 'Use key as initial default value',
		type: 'boolean',
		conflicts: ['key-as-default-value', 'null-as-default-value', 'string-as-default-value'],
	})
	.option('null-as-default-value', {
		alias: 'n',
		describe: 'Use null as default value',
		type: 'boolean',
		conflicts: ['key-as-default-value', 'key-as-initial-default-value', 'string-as-default-value'],
	})
	.option('string-as-default-value', {
		alias: 'd',
		describe: 'Use string as default value',
		type: 'string',
		conflicts: ['null-as-default-value', 'key-as-default-value', 'key-as-initial-default-value'],
	})
	.option('strip-prefix', {
		alias: 'sp',
		describe: 'Strip a prefix from the extracted key',
		type: 'string',
	})
	.group(['format', 'format-indentation', 'sort', 'sort-sensitivity', 'clean', 'replace', 'strip-prefix', 'po-source-locations'], 'Output')
	.group(
		['key-as-default-value', 'key-as-initial-default-value', 'null-as-default-value', 'string-as-default-value'],
		'Extracted key value (defaults to empty string)',
	)
	.conflicts('key-as-default-value', 'null-as-default-value')
	.conflicts('key-as-initial-default-value', 'null-as-default-value')
	.example('$0 -i ./src-a/ -i ./src-b/ -o strings.json', 'Extract (ts, html) from multiple paths')
	.example("$0 -i './{src-a,src-b}/' -o strings.json", 'Extract (ts, html) from multiple paths using brace expansion')
	.example('$0 -i ./src/ -o ./i18n/da.json -o ./i18n/en.json', 'Extract (ts, html) and save to da.json and en.json')
	.example("$0 -i ./src/ -o './i18n/{en,da}.json'", 'Extract (ts, html) and save to da.json and en.json using brace expansion')
	.example("$0 -i './src/**/*.{ts,tsx,html}' -o strings.json", 'Extract from ts, tsx and html')
	.example("$0 -i './src/**/!(*.spec).{ts,html}' -o strings.json", 'Extract from ts, html, excluding files with ".spec" in filename')
	.example("$0 -i ./src/ -o strings.json -sp 'PREFIX.'", "Strip the prefix 'PREFIX.' from the json keys")
	.wrap(110)
	.exitProcess(true)
	.parse(process.argv);

const extractorInstance = new NgxTranslateExtract(options);

// Run task
try {
	extractorInstance.execute();

	console.log(green('\nDone.\n'));
	process.exit(0);
} catch (e) {
	console.log(red(`\nAn error occurred: ${e}\n`));
	process.exit(1);
}
