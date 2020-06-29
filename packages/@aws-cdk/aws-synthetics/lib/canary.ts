import { Alarm, AlarmProps, Metric, MetricOptions } from '@aws-cdk/aws-cloudwatch';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import { Construct, Duration, Resource, ResourceProps } from '@aws-cdk/core';
import { CfnCanary } from '../lib';
import { Code } from './code';

// ALERT: this should eventually go into Runtime.ts
/**
 * Canary runtime version.
 *
 * Currently only 'syn-1.0' is a valid runtime. This includes the Lambda
 * runtime NodeJS 10.x. Make sure that your canary script is compatible
 * with NodeJS 10.x.
 *
 * In the future, if you need to use a runtime that doesn't exist as
 * a static member, you can instantiate a 'Runtime' object, e.g.:
 * 'new Runtime('syn-2.0')'.
 */
export class Runtime {
  /**
   * Synthetics library 1.0 and handler code 1.0. Compatible with
   * Lambda runtime NodeJS 10.x.
   */
  public static readonly SYN_1_0 = new Runtime('syn-1.0');

  /**
   * The name of the runtime version, as expected by the Canary resource.
   */
  public readonly name: string;

  constructor(name: string) {
    this.name = name;
  }

  /**
   * The runtime version expressed as a string
   */
  public toString(): string {
    return this.name;
  }
}

/**
 * The expression specifies the rate that the Canary runs.
 *
 * The rate forms the expression string that is expected in the Canary definition
 * as part of the Schedule property. A valid expression has the syntax 'rate(number unit)'
 * where the unit can be minute, minutes, or hour. 'rate(0 minute) or rate(0 hour) is a
 * special value that causes the canary to run only once.
 *
 * If you need to use an expression that doesn't exist as a static member, you can
 * instantiate a 'Expression' object, e.g: 'new Expression('rate(15 minutes)')'.
 */
export class Expression {
  /**
   * The expression rate(1 minute)
   */
  public static readonly ONE_MINUTE = new Expression('rate(1 minute)');

  /**
   * The expression rate(5 minutes)
   */
  public static readonly FIVE_MINUTES = new Expression('rate(5 minutes)');

  /**
   * The expression rate(1 hour)
   */
  public static readonly ONE_HOUR = new Expression('rate(1 hour)');

  /**
   * The expression rate(0 minute)
   */
  public static readonly RUN_ONCE = new Expression('rate(0 minute');

  /**
   * The expression that is expected by the Canary resource
   */
  public readonly expression: string;

  constructor(expression: string) {
    this.expression = expression;
  }

  /**
   * The expression expressed as a string
   */
  public toString(): string {
    return this.expression;
  }
}

/**
 * Options for a canary
 */
export interface CanaryOptions extends ResourceProps {
  /**
   * The location to store the data of the canary runs.
   *
   * @default - A new s3 bucket will be created.
   */
  readonly artifactS3Location?: string;
  /**
   * Canary execution role.
   *
   * This is the role that will be assumed by the canary upon execution.
   * It controls the permissions that the canary will have. The Role must
   * be assumable by the 'lambda.amazonaws.com' service principal.
   *
   * The default Role automatically has permissions granted for Canary execution.
   * If you provide a Role, you must add the relevant policies yourself.
   *
   * The relevant policies are "s3:PutObject", "s3:GetBucketLocation", "s3:ListAllMyBuckets",
   * "cloudwatch:PutMetricData", "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents".
   *
   * @default - A unique role will be generated for this canary.
   * Both supplied and generated roles can always be changed by calling 'addToRolePolicy'.
   */
  readonly role?: iam.IRole;

  /**
   * The name of the canary.
   *
   * @default - A unique physical ID will be generated for you and used as the canary's name.
   */
  readonly canaryName?: string;

  /**
   * How many seconds the canary should run before timing out.
   *
   * @default - same amount as expression
   */
  readonly timeout?: Duration;

  /**
   * How many seconds the canary will make regular runs according to the schedule in 'expression'.
   *
   * The default of 0 seconds means that the canary will continue to make runs until you stop it.
   *
   * @default Duration.seconds(0)
   */
  readonly duration?: Duration;

  /**
   * How often the canary will run during the duration. The syntax for expression is 'rate(number unit)'
   * where unit can be 'minute', 'minutes', or 'hour'. You can specify a frequency between 'rate(1 minute)'
   * and 'rate(1 hour)'.
   *
   * The default of 'rate(0 minute)' specifies that the canary will run only once when it is started.
   *
   * @default 'rate(0 minute)'
   */
  readonly expression?: Expression;

  /**
   * Whether or not the canary should start after creation.
   *
   * @default false
   */
  readonly startCanary?: boolean;

  /**
   * How many days should successful runs be retained
   *
   * @default Duration.days(31)
   */
  readonly successRetentionPeriod?: Duration;

  /**
   * How many days should failed runs be retained
   *
   * @default Duration.days(31)
   */
  readonly failureRetentionPeriod?: Duration;

  /**
   * If the endpoint that the canary is testing is inside of a vpc, then you must specify
   * which vpc.
   *
   * @default none
   */
  readonly vpc?: ec2.IVpc;
}

/**
 * Properties of a canary
 */
export interface CanaryProps extends CanaryOptions {
  /**
   * The handler of the code.
   */
  readonly handler: string;

  /**
   * The canary code. Currently only supported by inline code. In the future,
   * it will be possible to specify an asset or an s3 bucket where the code is.
   */
  readonly code: Code;

  /**
   * The runtime version of the canary. Currently, only 'syn-1.0' is allowed.
   */
  readonly runtime: Runtime;
}

/**
 * Base of a canary
 */
export abstract class CanaryBase extends Resource {
}

/**
 * The canary.
 */
export class Canary extends CanaryBase {
  /**
   * Execution role associated with this Canary.
   */
  public readonly role: iam.IRole;

  /**
   * VPC network to place Canary network interfaces
   *
   * Specify this if the Canary needs to access resources in a VPC.
   *
   * @default - Canary does not need to access a VPC.
   */
  public readonly vpc?: ec2.IVpc;

  /**
   * Canary ID
   * @attribute
   */
  public readonly canaryId: string;

  /**
   * Canary State
   * @attribute
   */
  public readonly canaryState: string;

  /**
   * Canary Name
   * @attribute
   */
  public readonly canaryName: string;

  constructor(scope: Construct, id: string, props: CanaryProps) {
    super(scope, id, {
      physicalName: props.canaryName,
    });

    const s3Location = props.artifactS3Location || new s3.Bucket(this, 'ServiceBucket').s3UrlForObject();

    // Created role will need these policies to run the Canary.
    const policy = new iam.PolicyDocument({
      statements: [new iam.PolicyStatement({
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
      })],
    });
    const inlinePolicies = { canaryPolicy : policy };

    this.role = props.role || new iam.Role(this, 'ServiceRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      inlinePolicies,
    });

    const duration = props.duration || Duration.seconds(0);
    const expression = props.expression || Expression.ONE_MINUTE;
    const timeout = props.timeout || Duration.seconds(60);

    const code = props.code.bind(this);

    const resource: CfnCanary = new CfnCanary(this, 'Resource', {
      artifactS3Location: s3Location,
      executionRoleArn: this.role.roleArn,
      startCanaryAfterCreation: props.startCanary ?? false,
      runtimeVersion: props.runtime.toString(),
      name: this.physicalName,
      runConfig: { timeoutInSeconds: timeout.toSeconds()},
      schedule: { durationInSeconds: String(duration.toSeconds()), expression: expression.toString() },
      failureRetentionPeriod: props.failureRetentionPeriod?.toDays(),
      successRetentionPeriod: props.successRetentionPeriod?.toDays(),
      code: { handler: props.handler, script: code.inlineCode},
    });
    this.canaryId = resource.attrId;
    this.canaryState = resource.attrState;
    this.canaryName = this.getResourceNameAttribute(resource.ref);
  }

  /**
   * Returns a new metric for the canary
   *
   * @default avg over 5 minutes
   */
  public metric(metricName: string, props?: MetricOptions): Metric {
    return new Metric({
      metricName,
      namespace: 'CloudWatchSynthetics',
      statistic: 'avg',
      ...props,
    }).attachTo(this);
  }

  /**
   * Returns a Duration metric for the canary
   *
   * @default avg over 5 minutes
   */
  public metricDuration(props?: MetricOptions): Metric {
    return this.metric('Duration', props);
  }

  /**
   * Returns a Success Percent metric for the canary
   *
   * @default avg over 5 minutes
   */
  public metricSuccess(props?: MetricOptions): Metric {
    return this.metric('SuccessPercent', props);
  }

  /**
   * Returns an alarm for the canary
   *
   * @default - success percent averaged over 5 minutes
   */
  public addAlarm(id: string, props?: AlarmProps): Alarm {
    const alarmProperties = {
      metric: props?.metric ?? this.metric('SuccessPercent'),
      threshold: props?.threshold ?? 99,
      evaluationPeriods: props?.evaluationPeriods ?? 2,
      alarmName: props?.alarmName ?? id,
    }
    return new Alarm(this, id, alarmProperties);
  }
}
