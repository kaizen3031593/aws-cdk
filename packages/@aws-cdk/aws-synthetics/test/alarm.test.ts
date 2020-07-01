import '@aws-cdk/assert/jest';
import { Stack } from '@aws-cdk/core';
import * as synth from '../lib';
import { objectLike, arrayWith } from '@aws-cdk/assert/lib/assertions/have-resource';

let stack: Stack;
beforeEach(() => {
  stack = new Stack();
});

test('Alarm can be created on a canary', () => {
  // GIVEN
  const canary = new synth.Canary(stack, 'mycanary', {
    canaryName: 'mycanary',
    handler: 'index.handler',
    code: synth.Code.fromInline('foo'),
  });

  // WHEN
  canary.createAlarm('myAlarm', {
    metric: canary.metricFailed(),
    evaluationPeriods: 2,
    threshold: 1,
    statistic: 'sum',
  });

  // THEN
  expect(stack).toHaveResourceLike('AWS::CloudWatch::Alarm',{
    MetricName: 'Failed',
    Namespace: 'CloudWatchSynthetics',
    EvaluationPeriods: 2,
    Statistic: 'Sum',
    Threshold: 1,
    Dimensions: arrayWith(objectLike({Value: {Ref: 'mycanaryDCC21B3D'}})),
  });
});