import { TranslationCollection, TranslationType } from '../utils/translation.collection.js';
import { PostProcessorInterface } from './post-processor.interface.js';

type TranslationMatrix = {
	[keyPart: string]: string[] | TranslationMatrix;
};

/**
 * This sorting post-processor adds the extracted translation keys into the order of the original file.
 *
 * This way a complete re-sort is avoided; this is just a temporary measure, down the line a complete re-sort is advisable.
 *
 * CAUTION: this post-processor is called at the beginning of the post-processing chain because it depends on the existing file translations order. (other post-processors only reference the draft)
 */
export class SortByOriginalOrderPostProcessor implements PostProcessorInterface {
	public name: string = 'SortByOriginalOrder';

	// More information on sort sensitivity: https://tc39.es/ecma402/#sec-collator-comparestrings
	// Passing undefined will be treated as 'variant' by default: https://tc39.es/ecma402/#sec-intl.collator
	public sortSensitivity: 'base' | 'accent' | 'case' | 'variant' | undefined = undefined;

	constructor(sortSensitivity: string | undefined) {
		if (isOfTypeSortSensitivity(sortSensitivity)) {
			this.sortSensitivity = sortSensitivity;
		} else {
			throw new Error(`Unknown sortSensitivity: ${sortSensitivity}`);
		}
	}

	process(draft: TranslationCollection, extracted: TranslationCollection, existing: TranslationCollection): TranslationCollection {
		const compareFn = this.sortSensitivity ? new Intl.Collator('en', { sensitivity: this.sortSensitivity }).compare : undefined;

		const existingKeysMap = Object.keys(existing.values).map((it) => it.split('.'));
		const keysMatrix = existingKeysMap.reduce((matrix, keyParts) => {
			let path = matrix;

			keyParts.forEach((keyPart, index) => {
				const isLastIndex = index === keyParts.length - 1;

				// check if it's the last part, then assign the key, otherwise nest key further
				if (isLastIndex) {
					path[keyPart] = keyParts;
				} else {
					path = path[keyPart] = {};
				}
			});

			return matrix;
		}, {} as TranslationMatrix);

		const sortedExtracted = extracted.sort(compareFn);

		Object.keys(sortedExtracted.values).map((extractedKey) => {
			const extractKeyParts = extractedKey.split('.');
			let path = keysMatrix;

			extractKeyParts.forEach((keyPart, index) => {
				const isNewKeyPart = path[keyPart] == null;
				const isLastIndex = index === extractKeyParts.length - 1;

				// the key part doesn't exist in the matrix yet, let's add it
				if (isNewKeyPart) {
					if (isLastIndex) {
						path[keyPart] = extractKeyParts;
					} else {
						path = path[keyPart] = {};
					}
				} else {
					// throw an error if the passed key cannot be nested due to structure of the existing keys
					// (e.g. A.B is a string, A.B.C cannot be nested within it because A.B is not a group)
					if (Array.isArray(path[keyPart]) && !isLastIndex) {
						throw new Error(`Unexpected key: ${extractKeyParts.join('.')}`);
					} else {
						path = path[keyPart] as TranslationMatrix;
					}
				}
			});
		});

		const flattenedKeys = flattenKeys(keysMatrix);

		// re-write the draft after the sorting
		draft = new TranslationCollection(
			flattenedKeys.reduce((acc, keyPath) => {
				acc[keyPath] = extracted.get(keyPath) ?? existing.get(keyPath);

				return acc;
			}, {} as TranslationType),
		);

		return draft;
	}
}

function isOfTypeSortSensitivity(keyInput: string | undefined): keyInput is 'base' | 'accent' | 'case' | 'variant' | undefined {
	return ['base', 'accent', 'case', 'variant'].includes(keyInput) || keyInput === undefined;
}

/**
 * Basic flattening function, turns the `keysMatrix` into a `keysList`.
 *
 * @param keysMatrix
 * @param keysList
 * @param path
 */
function flattenKeys(keysMatrix: TranslationMatrix, keysList: string[] = [], path: string[] = []): string[] {
	Object.keys(keysMatrix).forEach(([keyPart]) => {
		const keyPath = path.concat(keyPart);

		if (Array.isArray(keysMatrix[keyPart])) {
			keysList.push(keyPath.join('.'));
		} else {
			keysList = flattenKeys(keysMatrix[keyPart] as TranslationMatrix, keysList, keyPath);
		}
	});

	return keysList;
}
