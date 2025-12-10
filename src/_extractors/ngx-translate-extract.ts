import { CliArguments } from '../utils/utils.js';
import { ExtractTask } from '../cli/tasks/extract.task.js';
import { ParserInterface } from '../parsers/parser.interface.js';
import { PipeParser } from '../parsers/pipe.parser.js';
import { DirectiveParser } from '../parsers/directive.parser.js';
import { ServiceParser } from '../parsers/service.parser.js';
import { FunctionParser } from '../parsers/function.parser.js';
import { MarkerParser } from '../parsers/marker.parser.js';
import { FileCache } from '../cache/file-cache.js';
import { TranslationType } from '../utils/translation.collection.js';
import { PostProcessorInterface } from '../post-processors/post-processor.interface.js';
import { SortByOriginalOrderPostProcessor } from '../post-processors/sort-by-original-order.post-processor.js';
import { PurgeObsoleteKeysPostProcessor } from '../post-processors/purge-obsolete-keys.post-processor.js';
import { SortByKeyPostProcessor } from '../post-processors/sort-by-key.post-processor.js';
import { StripPrefixPostProcessor } from '../post-processors/strip-prefix.post-processor.js';
import { KeyAsDefaultValuePostProcessor } from '../post-processors/key-as-default-value.post-processor.js';
import { KeyAsInitialDefaultValuePostProcessor } from '../post-processors/key-as-initial-default-value.post-processor.js';
import { NullAsDefaultValuePostProcessor } from '../post-processors/null-as-default-value.post-processor.js';
import { StringAsDefaultValuePostProcessor } from '../post-processors/string-as-default-value.post-processor.js';
import { CompilerInterface } from '../compilers/compiler.interface.js';
import { CompilerFactory } from '../compilers/compiler.factory.js';

export class NgxTranslateExtract {
	public extractTask: ExtractTask;

	constructor(options: CliArguments) {
		const parsers: ParserInterface[] = [
			new PipeParser(),
			new DirectiveParser(),
			new ServiceParser(),
			options.marker ? new FunctionParser(options.marker) : new MarkerParser(),
		];
		const fileCache = options.cacheFile ? new FileCache<TranslationType[]>(options.cacheFile) : undefined;
		const postProcessors: PostProcessorInterface[] = [];
		const compiler: CompilerInterface = CompilerFactory.create(options.format, {
			indentation: options.formatIndentation,
			poSourceLocation: options.poSourceLocations,
		});

		// sorting by original order done at the top because it references the existing translation keys list rather than the draft.
		// The draft is not used for this step, hence why any other changes by other post-processors would otherwise be discarded
		if (options.sortOriginalOrder) {
			postProcessors.push(new SortByOriginalOrderPostProcessor(options.sortSensitivity));
		}

		if (options.clean) {
			postProcessors.push(new PurgeObsoleteKeysPostProcessor());
		}
		if (options.keyAsDefaultValue) {
			postProcessors.push(new KeyAsDefaultValuePostProcessor());
		} else if (options.keyAsInitialDefaultValue) {
			postProcessors.push(new KeyAsInitialDefaultValuePostProcessor());
		} else if (options.nullAsDefaultValue) {
			postProcessors.push(new NullAsDefaultValuePostProcessor());
		} else if (options.stringAsDefaultValue) {
			postProcessors.push(new StringAsDefaultValuePostProcessor({ defaultValue: options.stringAsDefaultValue as string }));
		}

		if (options.stripPrefix) {
			postProcessors.push(new StripPrefixPostProcessor({ prefix: options.stripPrefix as string }));
		}

		if (options.sort) {
			postProcessors.push(new SortByKeyPostProcessor(options.sortSensitivity));
		}

		this.extractTask = new ExtractTask(options.input, options.output, { replace: options.replace })
			.setParsers(parsers)
			.setPostProcessors(postProcessors)
			.setCompiler(compiler);

		if (fileCache) {
			this.extractTask.setCache(fileCache);
		}
	}

	execute() {
		this.extractTask.execute();
	}
}
