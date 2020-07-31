import '@aws-cdk/assert/jest';
import * as path from 'path';
import { objectLike, arrayWith } from '@aws-cdk/assert';
import { App, Stack } from '@aws-cdk/core';
import * as synthetics from '../lib';

let stack: Stack;
beforeEach(() => {
  stack = new Stack(new App(), 'canaries');
});

describe('Code.fromInline', () => {
  test('basic use case', () => {
    // WHEN
    new synthetics.Canary(stack, 'Canary', {
      test: synthetics.Test.custom({
        handler: 'index.handler',
        code: synthetics.Code.fromInline('exports.handler = async () => {\nconsole.log(\'hello world\');\n};'),
      }),
    });

    // THEN
    expect(stack).toHaveResourceLike('AWS::Synthetics::Canary', {
      Name: 'canariescanary8f7842',
      Code: {
        Handler: 'index.handler',
        Script: 'exports.handler = async () => {\nconsole.log(\'hello world\');\n};',
      },
      RuntimeVersion: 'syn-1.0',
    });
  });

  test('fails if size exceeds 460800 bytes', () => {
    expect(() => new synthetics.Canary(stack, 'Canary', {test: synthetics.Test.custom({
      handler: 'index.handler',
      code: synthetics.Code.fromInline(generateRandomString(460801)),
    })})).toThrowError('Canary source is too large, must be <= 460800 but is 460801');
  });

  test('fails if empty', () => {
    expect(() => new synthetics.Canary(stack, 'Canary', {test: synthetics.Test.custom({
      handler: 'index.handler',
      code: synthetics.Code.fromInline(''),
    })})).toThrowError('Canary inline code cannot be empty');
  });
});

describe('Code.fromAsset', () => {
  test('basic use case', () => {
    // WHEN
    new synthetics.Canary(stack, 'Canary', {
      test: synthetics.Test.custom({
        handler: 'index.handler',
        code: synthetics.Code.fromAsset(path.join(__dirname, 'nodejs', 'node_modules')),
      }),
    });

    // THEN
    expect(stack).toHaveResourceLike('AWS::Synthetics::Canary', {
      Name: 'canariescanary8f7842',
      Code: {
        Handler: 'index.handler',
        S3Bucket: objectLike({
          Ref: 'AssetParameters53582bab67c2633b90199d9abb22fa1a29cb66ef7fbad5eb48cdd82512e68b32S3Bucket45B170D5',
        }),
        S3Key: objectLike({
          'Fn::Join': arrayWith(arrayWith(objectLike({
            'Fn::Select': arrayWith(objectLike({
              'Fn::Split': arrayWith(objectLike({
                Ref: 'AssetParameters53582bab67c2633b90199d9abb22fa1a29cb66ef7fbad5eb48cdd82512e68b32S3VersionKey8583B253',
              })),
            })),
          })),
          ),
        }),
      },
      RuntimeVersion: 'syn-1.0',
    });
  });

  test('fails if non-zip asset is used', () => {
    expect(() => new synthetics.Canary(stack, 'Canary', {
      test: synthetics.Test.custom({
        handler: 'index.handler',
        code: synthetics.Code.fromAsset(path.join(__dirname, 'nodejs', 'node_modules', 'canary.js')),
      }),
    })).toThrowError('Asset must be a .zip file or a directory (/Users/conroyka/Desktop/aws/aws-cdk/packages/@aws-cdk/aws-synthetics/test/nodejs/node_modules/canary.js)');
  });

  test('fails if \'nodejs/node_modules\' folder structure not used', () => {
    expect(() => new synthetics.Canary(stack, 'Canary', {
      test: synthetics.Test.custom({
        handler: 'index.handler',
        code: synthetics.Code.fromAsset(path.join(__dirname, 'nodejs')),
      }),
    })).toThrowError('Asset must have the file path \'nodejs/node_modules\'');
  });
});

function generateRandomString(bytes: number) {
  let s = '';
  for (let i = 0; i < bytes; ++i) {
    s += String.fromCharCode(Math.round(Math.random() * 256));
  }
  return s;
}