import {expect, test} from '@jest/globals';
import {getLabels, getPathTokens, getRegexPattern, getTokenSets} from '../src/common';
test('getRegexPattern with 2 layers', () => {
  const pattern = getRegexPattern('base', 2);
  expect(pattern).toBe(`^(?:base)\/([^./]*)\/([^./]*)\/`);
});

test('getRegexPattern with 1 layer', () => {
  const pattern = getRegexPattern('base', 1);
  expect(pattern).toBe(`^(?:base)\/([^./]*)\/`);
});

test('getPathTokens with 1 layers pattern and 1 layers path', () => {
  const pattern = getRegexPattern('base', 1);
  const tokens = getPathTokens('base/foo/bar/somefile.ts', pattern);
  expect(tokens).toEqual(['base/foo/', 'foo']);
});

test('getPathTokens with 2 layers pattern and 2 layers path', () => {
  const pattern = getRegexPattern('base', 2);
  const tokens = getPathTokens('base/foo/bar/somefile.ts', pattern);
  expect(tokens).toEqual(['base/foo/bar/', 'foo', 'bar']);
});

test('getPathTokens with mismatch', () => {
  const pattern = getRegexPattern('base', 2);
  const tokens1 = getPathTokens('somefile.ts', pattern);
  expect(tokens1).toEqual([]);
  const tokens2 = getPathTokens('base/foobar/somefile.ts', pattern);
  expect(tokens2).toEqual([]);
});

test('getTokenSets with 2 paths and 2 laypers, common sub path', () => {
  const layers = 2;
  const filePaths = ['something/else/here.ts', 'base/foo/bar/somefile.ts', 'base/foo/baz/somefile.ts'];
  const pattern = getRegexPattern('base', layers);
  const result = getTokenSets(filePaths, pattern, layers);
  expect(result).toEqual([new Set(['base/foo/bar/', 'base/foo/baz/']), new Set(['foo']), new Set(['bar', 'baz'])]);
});

test('getTokenSets with 2 paths and 2 laypers, all different paths', () => {
  const layers = 2;
  const filePaths = ['something/else/here.ts', 'base/foo1/bar/somefile.ts', 'base/foo2/baz/somefile.ts'];
  const pattern = getRegexPattern('base', layers);
  const result = getTokenSets(filePaths, pattern, layers);
  expect(result).toEqual([new Set(['base/foo1/bar/', 'base/foo2/baz/']), new Set(['foo1', 'foo2']), new Set(['bar', 'baz'])]);
});

test('getTokenSets with 2 paths and 1 laypers, all different paths', () => {
  const layers = 1;
  const filePaths = ['something/else/here.ts', 'base/foo1/bar/somefile.ts', 'base/foo2/baz/somefile.ts'];
  const pattern = getRegexPattern('base', layers);
  const result = getTokenSets(filePaths, pattern, layers);
  expect(result).toEqual([new Set(['base/foo1/', 'base/foo2/']), new Set(['foo1', 'foo2'])]);
});

test('getLabels', () => {
  const labelTokenSets = [new Set(['foo1', 'foo2']), new Set(['bar', 'baz'])];
  const result = getLabels('cat|proj', ':', labelTokenSets);
  expect(result).toEqual(['cat:foo1', 'cat:foo2', 'proj:bar', 'proj:baz']);
});
