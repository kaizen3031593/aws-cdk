import { Alarm, AlarmProps, Metric, MetricOptions } from '@aws-cdk/aws-cloudwatch';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import { Construct, Duration, Resource, ResourceProps, IResource } from '@aws-cdk/core';
import { CfnCanary, Code } from '../lib';

/**
 * The rate specifies the rate that the Canary runs.
 *
 * The rate forms the expression string that is expected in the Canary definition
 * as part of the Schedule property. A valid expression has the syntax 'rate(number unit)'
 * where the unit can be minute, minutes, or hour. 'rate(0 minute) or rate(0 hour) is a
 * special value that causes the canary to run only once.
 *
 * If you need to use an expression that doesn't exist as a static member, you can
 * instantiate a 'Expression' object, e.g: 'new Expression('rate(15 minutes)')'.
 */
export class Rate {
  /**
   * The expression rate(1 minute)
   */
  public static readonly ONE_MINUTE = new Rate('rate(1 minute)');

  /**
   * The expression rate(5 minutes)
   */
  public static readonly FIVE_MINUTES = new Rate('rate(5 minutes)');

  /**
   * The expression rate(1 hour)
   */
  public static readonly ONE_HOUR = new Rate('rate(1 hour)');

  /**
   * The expression rate(0 minute)
   */
  public static readonly RUN_ONCE = new Rate('rate(0 minute)');

  /**
   * The expression that is expected by the Canary resource
   */
  public readonly expression: string;

  constructor(expression: string) {
    this.verifyExpression(expression);
    this.expression = expression;
  }

  /**
   * The rate expressed as a string
   */
  public toString(): string {
    return this.expression;
  }

  private verifyExpression(expression: string) {
    const exp = expression.split(' ');
    const rateAndNumber = exp[0].split('(');
    if (exp.length !== 2 ||
      rateAndNumber.length !== 2 ||
      rateAndNumber[0] !== 'rate' ||
      isNaN(Number(rateAndNumber[1])) ||
      (exp[1] !== 'minute)' && exp[1] !== 'minutes)' && exp[1] !== 'hour)')) {
      throw new Error('Expression must follow the syntax \'rate(number unit)\'');
    }
    if (exp[1] === 'hour)' && Number(rateAndNumber[1]) > 1 ||
        exp[1] === 'minutes)' && Number(rateAndNumber[1]) > 60)  {
      throw new Error('Expression must not be greater than 1 hour');
    }
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
   * How many seconds the canary should run before timing out.
   *
   * @default - same amount as rate
   */
  readonly timeout?: Duration;

  /**
   * How many seconds the canary will make regular runs according to the schedule in 'expression'.
   *
   * The default of 0 seconds means that the canary will continue to make runs until you stop it.
   *
   * @default Duration.seconds(0)
   */
  readonly lifetime?: Duration;

  /**
   * How often the canary will run during the duration. The syntax for expression is 'rate(number unit)'
   * where unit can be 'minute', 'minutes', or 'hour'. You can specify a frequency between 'rate(1 minute)'
   * and 'rate(1 hour)'.
   *
   * The default of 'rate(0 minute)' specifies that the canary will run only once when it is started.
   *
   * @default 'rate(0 minute)'
   */
  readonly rate?: Rate;

  /**
   * Whether or not the canary should start after creation.
   *
   * @default true
   */
  readonly enableCanary?: boolean;

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
   * The name of the canary.
   *
   * @default - A unique physical ID will be generated for you and used as the canary's name.
   */
  readonly canaryName: string;
}

export interface ICanary extends IResource {
  // Should extend iam.IGrantable, ec2.IConnectable
  // Should have all the properties and method signatures associated with a canary
}

/**
 * Represents a Canary defined outside of this stack.
 */
export interface CanaryAttributes {
  // All you need to find a canary from outside the stack
}

/**
 * Base of a canary
 */
export abstract class CanaryBase extends Resource implements ICanary {
}

/**
 * The canary.
 */
export class Canary extends CanaryBase {

  /**
   * Return the given named metric for all canaries
   */
  public static metricAll(metricName: string, props?: MetricOptions): Metric {
    return new Metric({
      namespace: 'CloudWatchSynthetics',
      metricName,
      ...props,
    });
  }

  /**
   * Metric for SuccessPercent across all canaries
   *
   * @default average over 5 minutes
   */
  public static metricAllSuccessPercent(props?: MetricOptions): Metric {
    return this.metricAll('SuccessPercent', { statistic: 'avg', ...props });
  }

  /**
   * Metric for Duration across all canaries
   *
   * @default average over 5 minutes
   */
  public static metricAllDuration(props?: MetricOptions): Metric {
    return this.metricAll('Duration', { statistic: 'avg', ...props });
  }

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
    super(scope, id);

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

    const duration = props.lifetime || Duration.seconds(0);
    const expression = props.rate || Rate.ONE_MINUTE;
    const timeout = props.timeout || Duration.seconds(60);

    const code = props.code.bind(this);

    const resource: CfnCanary = new CfnCanary(this, 'Resource', {
      artifactS3Location: s3Location,
      executionRoleArn: this.role.roleArn,
      startCanaryAfterCreation: props.enableCanary ?? true,
      runtimeVersion: 'syn-1.0',
      name: this.verifyName(props.canaryName),
      runConfig: { timeoutInSeconds: timeout.toSeconds()},
      schedule: { durationInSeconds: String(duration.toSeconds()), expression: expression.toString() },
      failureRetentionPeriod: props.failureRetentionPeriod?.toDays(),
      successRetentionPeriod: props.successRetentionPeriod?.toDays(),
      code: {
        handler: this.verifyHandler(props.handler),
        script: code.inlineCode,
        s3Bucket: code.s3Location?.bucketName,
        s3Key: code.s3Location?.objectKey,
        s3ObjectVersion: code.s3Location?.objectVersion,
      },
    });
    resource.node.addDependency(this.role);

    // this.canaryState = resource.getAtt('state').toString();
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
      dimensions: { CanaryName: this.canaryName },
      statistic: 'avg',
      ...props,
    }).attachTo(this);
  }

  /**
   * Returns a Duration metric for the canary
   *
   * @default avg over 10 minutes
   */
  public metricDuration(props?: MetricOptions): Metric {
    return this.metric('Duration', props);
  }

  /**
   * Returns a Success Percent metric for the canary
   *
   * @default avg over 10 minutes
   */
  public metricSuccessPercent(props?: MetricOptions): Metric {
    return this.metric('SuccessPercent', props);
  }

  /**
   * Returns Failed metric for the canary
   *
   * @default avg over 10 minutes
   */
  public metricFailed(props?: MetricOptions): Metric {
    return this.metric('Failed', props);
  }

  /**
   * Returns an alarm for the canary
   */
  public createAlarm(id: string, props: AlarmProps): Alarm {
    return new Alarm(this, id, props);
  }

  /**
   * Verifies if the given handler ends in '.handler'. Returns the handler if successful and
   * throws an error if not.
   *
   * @param handler - the handler given by the user
   */
  private verifyHandler(handler: string): string {
    if (handler.split('.').length !== 2 || handler.split('.')[1] !== 'handler') {
      throw new Error('Canary Handler must end in \'.handler\'');
    }
    if (handler.length > 21) {
      throw new Error('Canary Handler must be less than 21 characters.');
    }
    return handler;
  }

  /**
   * Verifies that the name fits the regex expression: ^[0-9a-z_\-]+$
   * Returns the name if successful and throws an error if not.
   *
   * @param name - the given name of the canary
   */
  private verifyName(name: string): string {
    const regex = new RegExp('^[0-9a-z_\-]+$');
    if (!regex.test(name)) {
      throw new Error('Canary Name must be lowercase, numbers, hyphens, or underscores (no spaces).');
    }
    if (name.length > 21) {
      throw new Error('Canary Name must be less than 21 characters');
    }
    return name;
  }
}
