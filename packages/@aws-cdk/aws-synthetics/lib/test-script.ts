import * as s3 from '@aws-cdk/aws-s3';
import { Code } from './code';

/**
 * Specify a test that the canary should run
 */
export class Test {
  /**
   * Specify a custom test with your own code
   *
   * @returns `Test` associated with the specified Code object
   * @param options The code and handler you want to run
   */
  public static custom(options: CustomOptions): Test {
    return new Test(undefined, options);
  }

  /**
   * Use this method to access the template for heartBeat monitoring. This test will hit the specified url and report back
   * information on the health of the website.
   *
   * @returns `Test` with the heartBeat template as the Code
   * @param url The url of the website you want to test
   *
   * 🚧 TODO: implement
   */
  // public static heartBeat(url: string){}

  /**
   * Use this method to access the template for api Endpoint monitoring. This test will hit the endpoint specified and report
   * back what it receives.
   *
   * @param url The url of the api endpoint you want to test
   * @param options Options to customize the api endpoint template
   *
   * 🚧 TODO: implement
   */
  // public static apiEndpoint(url: string, options: apiOptions){}

  /**
   * Use this method to access the template for a broken link checker. This test will check a specified number of links and report
   * back the first broken link found.
   *
   * @param url The starting url to check
   * @param options Options to customzie the template
   *
   * 🚧 TODO: implement
   */
  // public static brokenLink(url: string, options: linkOptions){}

  /**
   * Properties for test templates (mutually exclusive with `custom`).
   */
  public readonly testCode?: TestOptions;

  /**
   * Properties for custom code (mutually exclusive with `test`).
   */
  public readonly customCode?: CustomOptions;

  private constructor(testCode?: TestOptions, customCode?: CustomOptions){
    if ((testCode && customCode) || (!testCode && !customCode)) {
      throw new Error('One of `test` and `custom` must be specified, but not both');
    }
    if (customCode) {
      this.validateHandler(customCode.handler);
    }
    this.testCode = testCode;
    this.customCode = customCode;
  }

  /**
   * Verifies that the given handler ends in '.handler'. Returns the handler if successful and
   * throws an error if not.
   *
   * @param handler - the handler given by the user
   */
  private validateHandler(handler: string) {
    if (!handler.endsWith('.handler')) {
      throw new Error('Canary Handler must end in \'.handler\'');
    }
    if (handler.length > 21) {
      throw new Error('Canary Handler must be less than 21 characters');
    }
  }
}

/**
 * Configuration options for the test class
 */
export interface TestOptions {
  /**
   * The location of the code in S3 (mutually exclusive with `inlineCode`).
   */
  readonly s3Location?: s3.Location;

  /**
   * Inline code (mutually exclusive with `s3Location`).
   */
  readonly inlineCode?: string;

  /**
   * The handler of the code
   */
  readonly handler: string;
}

/**
 * Options for specifying a custom test
 */
export interface CustomOptions {
  /**
   * The code of the canary script
   */
  readonly code: Code,

  /**
   * The handler for the code
   */
  readonly handler: string,
}

