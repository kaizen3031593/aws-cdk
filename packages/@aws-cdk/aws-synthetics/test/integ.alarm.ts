import * as cdk from '@aws-cdk/core';
import * as synth from '../lib';

/*
 * Stack verification steps:
 *
 * -- aws cloudwatch describe-alarms --alarm-names myCanaryAlarm has Dimensions of Name:CanaryName, Value:mysecondcanary
 */
const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-canary-alarm');

const canary = new synth.Canary(stack, 'mycanary', {
  canaryName: 'integalarmcanary',
  code: synth.Code.fromInline('foo'),
  handler: 'index.handler',
});

canary.createAlarm('canaryAlarm', {
  metric: canary.metricFailed(),
  threshold: 1,
  evaluationPeriods: 2,
  alarmName: 'myCanaryAlarm',
});

app.synth();
