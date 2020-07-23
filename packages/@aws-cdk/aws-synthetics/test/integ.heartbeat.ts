import * as cdk from '@aws-cdk/core';
import * as synthetics from '../lib';

/*
 * Stack verification steps:
 *
 * -- aws synthetics get-canary --name heartbeatcan has a state of 'RUNNING'
 */
const app = new cdk.App();
const stack = new cdk.Stack(app, 'canary-heartbeat');

new synthetics.Canary(stack, 'mycanary', {
  name: 'canarywithheartbeat',
  test: synthetics.Test.heartBeat('https://kaizen3031593.github.io'),
});

app.synth();