import { describe, beforeEach, expect, it } from 'vitest';

import { PostProcessorInterface } from '../../src/post-processors/post-processor.interface.js';
import { TranslationCollection } from '../../src/utils/translation.collection.js';
import { SortByOriginalOrderPostProcessor } from '../../src/post-processors/sort-by-original-order.post-processor.js';

describe('SortByKeyPostProcessor - should throw error if sort sensitivity is not known', () => {
	it('should throw error', () => {
		expect(() => new SortByOriginalOrderPostProcessor('invalidSortSensitivityOption')).throw(
			'Unknown sortSensitivity: invalidSortSensitivityOption',
		);
	});
});

describe('SortByKeyPostProcessor - undefined sort sensitivity should sort as variant sort sensitivity', () => {
	let processor: PostProcessorInterface;

	beforeEach(() => {
		processor = new SortByOriginalOrderPostProcessor(undefined);
	});

	it('should sort keys alphanumerically in an empty existing collection', () => {
		// the draft is ignored for the processing, only the `extracted` and `existing` are used
		const draft = new TranslationCollection();
		const existing = new TranslationCollection();
		const extracted = new TranslationCollection({
			z: { value: 'last value', sourceFiles: [] },
			a: { value: 'a value', sourceFiles: [] },
			'9': { value: 'a numeric key', sourceFiles: [] },
			b: { value: 'another value', sourceFiles: [] },
		});

		// Assert all values are processed correctly
		expect(processor.process(draft, extracted, existing).values).to.deep.equal({
			'9': { value: 'a numeric key', sourceFiles: [] },
			a: { value: 'a value', sourceFiles: [] },
			b: { value: 'another value', sourceFiles: [] },
			z: { value: 'last value', sourceFiles: [] },
		});

		// Assert all keys are in the correct order
		expect(processor.process(draft, extracted, existing).keys()).toStrictEqual(['9', 'a', 'b', 'z']);
	});

	it('should perform variant sensitive sorting in a pre-filled existing collection', () => {
		// the draft is ignored for the processing, only the `extracted` and `existing` are used
		const draft = new TranslationCollection();
		const existing = new TranslationCollection({
			H: { value: 'letter H', sourceFiles: [] },
			'f.r.o.g': { value: 'letter f', sourceFiles: [] },
			C: { value: 'letter C', sourceFiles: [] },
			e: { value: 'letter e', sourceFiles: [] },
			'c.e.f': { value: 'letter c.e.f', sourceFiles: [] },
			i: { value: 'letter i', sourceFiles: [] },
			B: { value: 'letter B', sourceFiles: [] },
		});
		const extracted = new TranslationCollection({
			'c.e.f': { value: 'letter c.e.f', sourceFiles: [] },
			'c.e.d': { value: 'letter c.e.d', sourceFiles: [] },
			b: { value: 'letter b', sourceFiles: [] },
			a: { value: 'letter a', sourceFiles: [] },
			à: { value: 'letter à', sourceFiles: [] },
			'f.r.a.i.l': { value: 'letter f', sourceFiles: [] },
			'f.r.a.y': { value: 'letter f', sourceFiles: [] },
			h: { value: 'letter h', sourceFiles: [] },
			B: { value: 'letter B', sourceFiles: [] },
			H: { value: 'letter H', sourceFiles: [] },
			'frog.r.a.y': { value: 'letter f', sourceFiles: [] },
			'frog.r.a.i.l': { value: 'letter f', sourceFiles: [] },
			C: { value: 'letter C', sourceFiles: [] },
			e: { value: 'letter e', sourceFiles: [] },
			i: { value: 'letter i', sourceFiles: [] },
		});

		// Assert all values are processed correctly
		expect(processor.process(draft, extracted, existing).values).to.deep.equal({
			H: { value: 'letter H', sourceFiles: [] },
			'f.r.o.g': { value: 'letter f', sourceFiles: [] },
			// these two translation keys follow after `f.r.o.g` because in the `existing` translations it was ordered this way
			'f.r.a.i.l': { value: 'letter f', sourceFiles: [] },
			'f.r.a.y': { value: 'letter f', sourceFiles: [] },
			C: { value: 'letter C', sourceFiles: [] },
			e: { value: 'letter e', sourceFiles: [] },
			'c.e.f': { value: 'letter c.e.f', sourceFiles: [] },
			// this key is added after `c.e.f` because in the `existing` translations it was ordered this way
			'c.e.d': { value: 'letter c.e.d', sourceFiles: [] },
			i: { value: 'letter i', sourceFiles: [] },
			B: { value: 'letter B', sourceFiles: [] },
			// these translation keys are all added sorted to the end of the file
			a: { value: 'letter a', sourceFiles: [] },
			b: { value: 'letter b', sourceFiles: [] },
			'frog.r.a.i.l': { value: 'letter f', sourceFiles: [] },
			'frog.r.a.y': { value: 'letter f', sourceFiles: [] },
			h: { value: 'letter h', sourceFiles: [] },
			à: { value: 'letter à', sourceFiles: [] },
		});

		// Assert all keys are in the correct order
		expect(processor.process(draft, extracted, existing).keys()).toStrictEqual([
			'H',
			'f.r.o.g',
			'f.r.a.i.l',
			'f.r.a.y',
			'C',
			'e',
			'c.e.f',
			'c.e.d',
			'i',
			'B',
			'a',
			'b',
			'frog.r.a.i.l',
			'frog.r.a.y',
			'h',
			'à',
		]);
	});
});
