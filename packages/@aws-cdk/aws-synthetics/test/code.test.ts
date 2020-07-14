import '@aws-cdk/assert/jest';
import { Stack } from '@aws-cdk/core';
import * as synth from '../lib';
import * as path from 'path';

let stack: Stack;
beforeEach(() => {
  stack = new Stack();
});

describe('synth.Code.fromInline', () => {
  test('fails if empty', () => {
    expect(() => synth.Code.fromInline('')).toThrowError('Canary inline code cannot be empty');
  });

  test('fails if larger than 4096 bytes', () => {
    expect(() => synth.Code.fromInline(generateRandomString(4097))).toThrowError('Canary source is too large, must be <= 4096 but is 4097');
  });

  test('inline code forms the script property', () => {
    // WHEN
    new synth.Canary(stack, 'Canary', {
      canaryName: 'mycanary',
      handler: 'index.handler',
      code: synth.Code.fromInline('code'),
    });
  
    // THEN
    expect(stack).toHaveResourceLike('AWS::Synthetics::Canary', {
      Name: 'mycanary',
      Code: {
        Handler: 'index.handler',
        Script: 'code',
      },
      RuntimeVersion: 'syn-1.0',
    });
  });
}),

describe('synth.Code.fromAsset', () => {
  test('fails without directory structure nodejs/node_modules', () => {
    expect(() => synth.Code.fromAsset(path.join(__dirname, 'canary-code')).bind(stack)).toThrowError('Local directory must include the folder structure nodejs/node_modules');
  });

  test('fails without directory structure node_modules', () => {
    expect(() => synth.Code.fromAsset(path.join(__dirname, 'canaryFake')).bind(stack)).toThrowError('Local directory must include the folder structure nodejs/node_modules');
  });
  
  test('fails if non-zip asset is used', () => {
    expect(() => synth.Code.fromAsset(path.join(__dirname, 'canary-code', 'canary.js')).bind(stack)).toThrowError(`Asset must be a .zip file or a directory (${path.join(__dirname, 'canary-code', 'canary.js')})`);
  });
})

function generateRandomString(bytes: number) {
  let s = '';
  for (let i = 0; i < bytes; ++i) {
    s += String.fromCharCode(Math.round(Math.random() * 256));
  }
  return s;
}