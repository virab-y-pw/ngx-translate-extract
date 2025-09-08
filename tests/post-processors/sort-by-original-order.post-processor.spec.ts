import { describe, beforeEach, expect, it } from 'vitest';

import { PostProcessorInterface } from '../../src/post-processors/post-processor.interface.js';
import { SortByKeyPostProcessor } from '../../src/post-processors/sort-by-key.post-processor.js';
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
		const collection = new TranslationCollection({
			z: { value: 'last value', sourceFiles: [] },
			a: { value: 'a value', sourceFiles: [] },
			'9': { value: 'a numeric key', sourceFiles: [] },
			b: { value: 'another value', sourceFiles: [] },
		});
		const extracted = new TranslationCollection();
		const existing = new TranslationCollection();

		// Assert all values are processed correctly
		expect(processor.process(collection, extracted, existing).values).to.deep.equal({
			'9': { value: 'a numeric key', sourceFiles: [] },
			a: { value: 'a value', sourceFiles: [] },
			b: { value: 'another value', sourceFiles: [] },
			z: { value: 'last value', sourceFiles: [] },
		});

		// Assert all keys are in the correct order
		expect(processor.process(collection, extracted, existing).keys()).toStrictEqual(['9', 'a', 'b', 'z']);
	});

	it('should perform variant sensitive sorting in a pre-filled existing collection', () => {
		const extracted = new TranslationCollection({
			'c.e.f': { value: 'letter c.e.f', sourceFiles: [] },
			'c.e.d': { value: 'letter c.e.d', sourceFiles: [] },
			b: { value: 'letter b', sourceFiles: [] },
			a: { value: 'letter a', sourceFiles: [] },
			à: { value: 'letter à', sourceFiles: [] },
			h: { value: 'letter h', sourceFiles: [] },
			B: { value: 'letter B', sourceFiles: [] },
			H: { value: 'letter H', sourceFiles: [] },
			'f.r.a.y': { value: 'letter f', sourceFiles: [] },
			'f.r.a.i.l': { value: 'letter f', sourceFiles: [] },
			C: { value: 'letter C', sourceFiles: [] },
			e: { value: 'letter e', sourceFiles: [] },
			i: { value: 'letter i', sourceFiles: [] },
		});
		const existing = new TranslationCollection({
			H: { value: 'letter H', sourceFiles: [] },
			'f.r.o.g': { value: 'letter f', sourceFiles: [] },
			C: { value: 'letter C', sourceFiles: [] },
			e: { value: 'letter e', sourceFiles: [] },
			'c.e.f': { value: 'letter c.e.f', sourceFiles: [] },
			i: { value: 'letter i', sourceFiles: [] },
			B: { value: 'letter B', sourceFiles: [] },
		});
		const collection = new TranslationCollection({
			c: { value: 'letter c', sourceFiles: [] },
			j: { value: 'letter j', sourceFiles: [] },
			b: { value: 'letter b', sourceFiles: [] },
			a: { value: 'letter a', sourceFiles: [] },
			à: { value: 'letter à', sourceFiles: [] },
			h: { value: 'letter h', sourceFiles: [] },
			B: { value: 'letter B', sourceFiles: [] },
			H: { value: 'letter H', sourceFiles: [] },
			i: { value: 'letter i', sourceFiles: [] },
			C: { value: 'letter C', sourceFiles: [] },
			e: { value: 'letter e', sourceFiles: [] },
			f: { value: 'letter f', sourceFiles: [] },
			d: { value: 'letter d', sourceFiles: [] },
			A: { value: 'letter A', sourceFiles: [] },
			g: { value: 'letter g', sourceFiles: [] },
		});

		// Assert all values are processed correctly
		expect(processor.process(collection, extracted, existing).values).to.deep.equal({
			H: { value: 'letter H', sourceFiles: [] },
			'f.r.o.g': { value: 'letter f', sourceFiles: [] },
			'f.r.a.i.l': { value: 'letter f', sourceFiles: [] },
			'f.r.a.y': { value: 'letter f', sourceFiles: [] },
			C: { value: 'letter C', sourceFiles: [] },
			e: { value: 'letter e', sourceFiles: [] },
			'c.e.f': { value: 'letter c.e.f', sourceFiles: [] },
			'c.e.d': { value: 'letter c.e.d', sourceFiles: [] },
			i: { value: 'letter i', sourceFiles: [] },
			B: { value: 'letter B', sourceFiles: [] },
			a: { value: 'letter a', sourceFiles: [] },
			b: { value: 'letter b', sourceFiles: [] },
			h: { value: 'letter h', sourceFiles: [] },
			à: { value: 'letter à', sourceFiles: [] },
		});

		// Assert all keys are in the correct order
		expect(processor.process(collection, extracted, existing).keys()).toStrictEqual([
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
			'h',
			'à',
		]);
	});
});
