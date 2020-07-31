import '@aws-cdk/assert/jest';
// import { arrayWith, objectLike } from '@aws-cdk/assert';
// import * as iam from '@aws-cdk/aws-iam';
// import * as s3 from '@aws-cdk/aws-s3';
import { App, /*Duration,*/ Stack } from '@aws-cdk/core';
import * as synthetics from '../lib';

let stack: Stack;
beforeEach(() => {
  stack = new Stack(new App(), 'canaries');
});

test('Create a basic canary', () => {
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

// test('Canary can have specified name', () => {
//   // WHEN
//   new synthetics.Canary(stack, 'Canary', {
//     canaryName: 'mycanary',
//   });

//   // THEN
//   expect(stack).toHaveResourceLike('AWS::Synthetics::Canary', {
//     Name: 'mycanary',
//     Code: {
//       Handler: 'index.handler',
//       Script: 'exports.handler = async () => {\nconsole.log(\'hello world\');\n};',
//     },
//     RuntimeVersion: 'syn-1.0',
//   });
// });

// test('Canary returns error when name is specified incorrectly', () => {
//   expect(() => new synthetics.Canary(stack, 'Canary', {canaryName: 'myCanary'})).toThrowError('Canary Name must be lowercase, numbers, hyphens, or underscores (no spaces)');
// });

// test('Canary name must be less than 21 characters', () => {
//   expect(() => new synthetics.Canary(stack, 'Canary', {canaryName: 'canary-name-super-long'})).toThrowError('Canary Name must be less than 21 characters');
// });

// test('Canary can have specified IAM role', () => {
//   // GIVEN
//   const role = new iam.Role(stack, 'role', {
//     assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
//   });

//   role.addToPolicy(new iam.PolicyStatement({
//     resources: ['*'],
//     actions: [
//       's3:PutObject',
//       's3:GetBucketLocation',
//       's3:ListAllMyBuckets',
//       'cloudwatch:PutMetricData',
//       'logs:CreateLogGroup',
//       'logs:CreateLogStream',
//       'logs:PutLogEvents',
//     ],
//   }));

//   // WHEN
//   new synthetics.Canary(stack, 'Canary', {
//     canaryName: 'mycanary',
//     role,
//   });

//   // THEN
//   expect(stack).toHaveResourceLike('AWS::Synthetics::Canary', {
//     Name: 'mycanary',
//     Code: {
//       Handler: 'index.handler',
//       Script: 'exports.handler = async () => {\nconsole.log(\'hello world\');\n};',
//     },
//     RuntimeVersion: 'syn-1.0',
//     ExecutionRoleArn: objectLike({
//       'Fn::GetAtt': arrayWith('roleC7B7E775'),
//     }),
//   });
// });

// test('Canary can have specified s3 Bucket', () => {
//   // GIVEN
//   const bucket = new s3.Bucket(stack, 'mytestbucket');

//   // WHEN
//   new synthetics.Canary(stack, 'Canary', {
//     canaryName: 'mycanary',
//     artifactBucket: bucket,
//   });

//   // THEN
//   expect(stack).toHaveResourceLike('AWS::Synthetics::Canary', {
//     Name: 'mycanary',
//     Code: {
//       Handler: 'index.handler',
//       Script: 'exports.handler = async () => {\nconsole.log(\'hello world\');\n};',
//     },
//     RuntimeVersion: 'syn-1.0',
//     ArtifactS3Location: objectLike({
//       'Fn::Join': arrayWith(arrayWith('s3://', {Ref: 'mytestbucket8DC16178'})),
//     }),
//   });
// });

// test('Canary can set schedule with Rate', () => {
//   // WHEN
//   new synthetics.Canary(stack, 'Canary', {
//     canaryName: 'mycanary',
//     schedule: synthetics.Schedule.rate(Duration.minutes(3)),
//   });

//   // THEN
//   expect(stack).toHaveResourceLike('AWS::Synthetics::Canary', {
//     Name: 'mycanary',
//     Code: {
//       Handler: 'index.handler',
//       Script: 'exports.handler = async () => {\nconsole.log(\'hello world\');\n};',
//     },
//     RuntimeVersion: 'syn-1.0',
//     Schedule: objectLike({ Expression: 'rate(3 minutes)'}),
//   });
// });

// test('Canary can set schedule with Expression', () => {
//   // WHEN
//   new synthetics.Canary(stack, 'Canary', {
//     canaryName: 'mycanary',
//     schedule: synthetics.Schedule.expression('rate(3 minutes)'),
//   });

//   // THEN
//   expect(stack).toHaveResourceLike('AWS::Synthetics::Canary', {
//     Name: 'mycanary',
//     Code: {
//       Handler: 'index.handler',
//       Script: 'exports.handler = async () => {\nconsole.log(\'hello world\');\n};',
//     },
//     RuntimeVersion: 'syn-1.0',
//     Schedule: objectLike({ Expression: 'rate(3 minutes)'}),
//   });
// });

// test('Canary can set schedule to run once', () => {
//   // WHEN
//   new synthetics.Canary(stack, 'Canary', {
//     canaryName: 'mycanary',
//     schedule: synthetics.Schedule.once(),
//   });

//   // THEN
//   expect(stack).toHaveResourceLike('AWS::Synthetics::Canary', {
//     Name: 'mycanary',
//     Code: {
//       Handler: 'index.handler',
//       Script: 'exports.handler = async () => {\nconsole.log(\'hello world\');\n};',
//     },
//     RuntimeVersion: 'syn-1.0',
//     Schedule: objectLike({ Expression: 'rate(0 minutes)'}),
//   });
// });

// test('Schedule fails when rate above 60 minutes', () => {
//   expect(() => new synthetics.Canary(stack, 'Canary', {schedule: synthetics.Schedule.rate(Duration.minutes(61))})).toThrowError('Schedule duration must be either 0 (for a single run) or between 1 and 60 minutes');
// });

// test('Canary can set timeToLive', () => {
//   // WHEN
//   new synthetics.Canary(stack, 'Canary', {
//     canaryName: 'mycanary',
//     timeToLive: Duration.minutes(30),
//   });

//   // THEN
//   expect(stack).toHaveResourceLike('AWS::Synthetics::Canary', {
//     Name: 'mycanary',
//     Code: {
//       Handler: 'index.handler',
//       Script: 'exports.handler = async () => {\nconsole.log(\'hello world\');\n};',
//     },
//     RuntimeVersion: 'syn-1.0',
//     Schedule: objectLike({ DurationInSeconds: '1800'}),
//   });
// });

// test('Canary can disable startCanaryAfterCreation', () => {
//   // WHEN
//   new synthetics.Canary(stack, 'Canary', {
//     canaryName: 'mycanary',
//     startAfterCreation: false,
//   });

//   // THEN
//   expect(stack).toHaveResourceLike('AWS::Synthetics::Canary', {
//     Name: 'mycanary',
//     Code: {
//       Handler: 'index.handler',
//       Script: 'exports.handler = async () => {\nconsole.log(\'hello world\');\n};',
//     },
//     RuntimeVersion: 'syn-1.0',
//     StartCanaryAfterCreation: false,
//   });
// });

// test('Canary can set successRetentionPeriod', () => {
//   // WHEN
//   new synthetics.Canary(stack, 'Canary', {
//     canaryName: 'mycanary',
//     successRetentionPeriod: Duration.days(1),
//   });

//   // THEN
//   expect(stack).toHaveResourceLike('AWS::Synthetics::Canary', {
//     Name: 'mycanary',
//     Code: {
//       Handler: 'index.handler',
//       Script: 'exports.handler = async () => {\nconsole.log(\'hello world\');\n};',
//     },
//     RuntimeVersion: 'syn-1.0',
//     SuccessRetentionPeriod: 1,
//   });
// });

// test('Canary can set failureRetentionPeriod', () => {
//   // WHEN
//   new synthetics.Canary(stack, 'Canary', {
//     canaryName: 'mycanary',
//     failureRetentionPeriod: Duration.days(1),
//   });

//   // THEN
//   expect(stack).toHaveResourceLike('AWS::Synthetics::Canary', {
//     Name: 'mycanary',
//     Code: {
//       Handler: 'index.handler',
//       Script: 'exports.handler = async () => {\nconsole.log(\'hello world\');\n};',
//     },
//     RuntimeVersion: 'syn-1.0',
//     FailureRetentionPeriod: 1,
//   });
// });
