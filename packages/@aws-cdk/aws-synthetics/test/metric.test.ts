import '@aws-cdk/assert/jest';
import { Stack } from '@aws-cdk/core';
import * as synth from '../lib';
import { objectLike, arrayWith } from '@aws-cdk/assert/lib/assertions/have-resource';

let stack: Stack;
beforeEach(() => {
  stack = new Stack();
});

test('Add a metric on a canary', () => {
  // GIVEN
  const canary = new synth.Canary(stack, 'mycanary', {
    canaryName: 'mycanary',
    handler: 'index.handler',
    code: synth.Code.fromInline('foo'),
  });

  // WHEN
  const metric = canary.metric('SuccessPercent');

  // THEN
  expect(metric).toEqual({
    period: { amount: 5, unit: { inMillis: 60000, label: 'minutes' } },
    dimensions: { CanaryName: canary.canaryName },
    namespace: 'CloudWatchSynthetics',
    metricName: 'SuccessPercent',
    statistic: 'Average',
  })
});

test('Add metric success percent', () => {
  // GIVEN
  const canary = new synth.Canary(stack, 'mycanary', {
    canaryName: 'mycanary',
    handler: 'index.handler',
    code: synth.Code.fromInline('foo'),
  });

  // WHEN
  const metric = canary.metricSuccessPercent();

  // THEN
  expect(metric).toEqual({
    period: { amount: 5, unit: { inMillis: 60000, label: 'minutes' } },
    dimensions: { CanaryName: canary.canaryName },
    namespace: 'CloudWatchSynthetics',
    metricName: 'SuccessPercent',
    statistic: 'Average',
  })
});

test('Add metric failed', () => {
  // GIVEN
  const canary = new synth.Canary(stack, 'mycanary', {
    canaryName: 'mycanary',
    handler: 'index.handler',
    code: synth.Code.fromInline('foo'),
  });

  // WHEN
  const metric = canary.metricFailed();

  // THEN
  expect(metric).toEqual({
    period: { amount: 5, unit: { inMillis: 60000, label: 'minutes' } },
    dimensions: { CanaryName: canary.canaryName },
    namespace: 'CloudWatchSynthetics',
    metricName: 'Failed',
    statistic: 'Average',
  })
});

test('Add metric failed', () => {
  // GIVEN
  const canary = new synth.Canary(stack, 'mycanary', {
    canaryName: 'mycanary',
    handler: 'index.handler',
    code: synth.Code.fromInline('foo'),
  });

  // WHEN
  const metric = canary.metricDuration();

  // THEN
  expect(metric).toEqual({
    period: { amount: 5, unit: { inMillis: 60000, label: 'minutes' } },
    dimensions: { CanaryName: canary.canaryName },
    namespace: 'CloudWatchSynthetics',
    metricName: 'Duration',
    statistic: 'Average',
  })
});

test('Can create metrics across all canaries -- success percent', () => {
  // WHEN
  const metric = synth.Canary.metricAllSuccessPercent();

  // THEN
  expect(metric).toEqual({
    period: { amount: 5, unit: { inMillis: 60000, label: 'minutes' } },
    namespace: 'CloudWatchSynthetics',
    metricName: 'SuccessPercent',
    statistic: 'Average',
  })
});

test('Can create metrics across all canaries -- duration', () => {
  // WHEN
  const metric = synth.Canary.metricAllDuration();

  // THEN
  expect(metric).toEqual({
    period: { amount: 5, unit: { inMillis: 60000, label: 'minutes' } },
    namespace: 'CloudWatchSynthetics',
    metricName: 'Duration',
    statistic: 'Average',
  })
});