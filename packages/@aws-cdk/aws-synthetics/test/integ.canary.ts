import * as cdk from '@aws-cdk/core';
import * as synth from '../lib';

/*
 * Stack verification steps:
 *
 * -- aws synthetics get-canary --name acanary has a state of 'RUNNING'
 */
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-canary');

new synth.Canary(stack, 'mycanary', {
  canaryName: 'integcanary',
  code: synth.Code.fromInline('foo'),
  handler: 'index.handler',
});

app.synth();
