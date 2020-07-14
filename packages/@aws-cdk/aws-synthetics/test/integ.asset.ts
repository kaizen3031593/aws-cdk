import * as cdk from '@aws-cdk/core';
import * as synth from '../lib';
import * as path from 'path';

const name = 'asset-canary-13';
/*
 * Stack verification steps:
 *
 * -- aws synthetics get-canary --name asset-test has a state of 'RUNNING'
 */
const app = new cdk.App();
const stack = new cdk.Stack(app, name);

new synth.Canary(stack, name, {
  canaryName: name,
  code: synth.Code.fromAsset(path.join(__dirname, 'canary')),
  handler: 'canary.handler',
});

app.synth();
