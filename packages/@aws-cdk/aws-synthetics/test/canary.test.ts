import '@aws-cdk/assert/jest';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import { Stack } from '@aws-cdk/core';
import * as synth from '../lib';
import { objectLike, arrayWith } from '@aws-cdk/assert/lib/assertions/have-resource';

let stack: Stack;
beforeEach(() => {
  stack = new Stack();
});

test('Create a basic canary', () => {
  // WHEN
  new synth.Canary(stack, 'Canary', {
    canaryName: 'mycanary',
    handler: 'index.handler',
    code: synth.Code.fromInline('foo'),
  });

  // THEN
  expect(stack).toHaveResourceLike('AWS::Synthetics::Canary',{
    Name: 'mycanary',
    Code: {
      Handler: 'index.handler',
      Script: 'foo',
    },
    RuntimeVersion: 'syn-1.0',
  });
});

test('Canary can have specified IAM role', () => {
  // GIVEN
  const role = new iam.Role(stack, 'role', {
    assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  });

  role.addToPolicy(new iam.PolicyStatement({
    resources: ['*'],
    actions: [
      's3:PutObject',
      's3:GetBucketLocation',
      's3:ListAllMyBuckets',
      'cloudwatch:PutMetricData',
      'logs:CreateLogGroup',
      'logs:CreateLogStream',
      'logs:PutLogEvents',
    ],
  }));

  // WHEN 
  new synth.Canary(stack, 'Canary', {
    canaryName: 'mycanary',
    handler: 'index.handler',
    code: synth.Code.fromInline('foo'),
    role,
  });

  // THEN
  expect(stack).toHaveResourceLike('AWS::Synthetics::Canary',{
    Name: 'mycanary',
    Code: {
      Handler: 'index.handler',
      Script: 'foo',
    },
    RuntimeVersion: 'syn-1.0',
    ExecutionRoleArn: objectLike({
      'Fn::GetAtt': arrayWith('roleC7B7E775'),
    }),
  });
});

test('Canary can have specified s3 Bucket', () => {
  // GIVEN
  const bucket = new s3.Bucket(stack, 'mytestbucket');
  
  // WHEN 
  new synth.Canary(stack, 'Canary', {
    canaryName: 'mycanary',
    handler: 'index.handler',
    code: synth.Code.fromInline('foo'),
    artifactS3Location: bucket.urlForObject(),
  });
  
  // THEN
  expect(stack).toHaveResourceLike('AWS::Synthetics::Canary',{
    Name: 'mycanary',
    Code: {
      Handler: 'index.handler',
      Script: 'foo',
    },
    RuntimeVersion: 'syn-1.0',
    ArtifactS3Location: objectLike({
      'Fn::Join' : arrayWith(arrayWith('https://s3.', {Ref : 'mytestbucket8DC16178'})),
    }),
  });
});

test('Canary can have specified rate', () => {
  // WHEN 
  new synth.Canary(stack, 'Canary', {
    canaryName: 'mycanary',
    handler: 'index.handler',
    code: synth.Code.fromInline('foo'),
    rate: synth.Rate.RUN_ONCE,
  });
  
  // THEN
  expect(stack).toHaveResourceLike('AWS::Synthetics::Canary',{
    Name: 'mycanary',
    Code: {
      Handler: 'index.handler',
      Script: 'foo',
    },
    RuntimeVersion: 'syn-1.0',
    Schedule: objectLike({
      Expression: 'rate(0 minute)',
    }),
  });
});

test('Canary returns error when handler is specified incorrectly', () => {
  expect(() => defineCanaryWithHandler('index.function')).toThrowError('Canary Handler must end in \'.handler\'');
});

test('Canary returns error when name is specified incorrectly', () => {
  expect(() => defineCanaryWithName('myCanary')).toThrowError('Canary Name must fit the regex expression ^[0-9a-z_\-]+$ (should be lowercase and with no spaces).');
});

test('Canary returns error when custom rate has wrong syntax', () => {
  expect(() => defineCanaryWithRate(new synth.Rate('rate(1_minute)'))).toThrowError('Expression must follow the syntax \'rate(number unit)\'');
});

test('Canary returns error when custom rate is out of range', () => {
  expect(() => defineCanaryWithRate(new synth.Rate('rate(100 minutes)'))).toThrowError('Expression must not be greater than 1 hour');
});

function defineCanaryWithHandler(handler: string) {
  new synth.Canary(stack, 'Canary', {
    canaryName: 'mycanary',
    handler,
    code: synth.Code.fromInline('foo'),
  }); 
}

function defineCanaryWithName(name: string) {
  new synth.Canary(stack, 'Canary', {
    canaryName: name,
    handler: 'index.handler',
    code: synth.Code.fromInline('foo'),
  }); 
}

function defineCanaryWithRate(rate: synth.Rate) {
  new synth.Canary(stack, 'Canary', {
    canaryName: 'mycanary',
    handler: 'index.handler',
    code: synth.Code.fromInline('foo'),
    rate,
  });
}
