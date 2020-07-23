import * as s3 from '@aws-cdk/aws-s3';
import { Construct, hashValidator } from '@aws-cdk/core';
import { Code } from './code';

/**
 * Specify a test that the canary should run
 */
export class Test {
  /**
   * Specify a custom test with your own code
   *
   * @returns `Test` associated with the specified Code object
   * @param code The script you want the canary to run
   * @param handler The handler of the code
   */
  public static custom(scope: Construct, options: CustomOptions): Test {
    const codeConfig = options.code.bind(scope);
    return new Test({
      handler: options.handler,
      inlineCode: codeConfig.inlineCode,
      s3Location: codeConfig.s3Location,
    });
  }

  /**
   * Use this method to access the template for heartBeat monitoring. This test will hit the specified url and report back
   * information on the health of the website.
   *
   * @returns `Test` with the heartBeat template as the Code
   * @param url The url of the website you want to test
   *
   * TODO: implement
   */
  public static heartBeat(url: string){
    return new Test({
      handler: 'index.handler',
      inlineCode: new HeartBeatTemplate(url).inlineCode,
    });
  }

  /**
   * Use this method to access the template for api Endpoint monitoring. This test will hit the endpoint specified and report
   * back what it receives.
   *
   * @param url The url of the api endpoint you want to test
   * @param options Options to customize the api endpoint template
   *
   * TODO: implement
   */
  //public static apiEndpoint(url: string, options: apiOptions){}

  /**
   * Use this method to access the template for a broken link checker. This test will check a specified number of links and report
   * back the first broken link found.
   *
   * @param url The starting url to check
   * @param options Options to customzie the template
   *
   * TODO: implement
   */
  //public static brokenLink(url: string, options: linkOptions){}

  private constructor(public readonly config: TestConfig){}
}

/**
 * Configuration property of the test class
 */
export interface TestConfig {
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

export class HeartBeatTemplate {
  readonly inlineCode: string;

  constructor(url: string) {
    this.inlineCode = `var synthetics = require('Synthetics');
      const log = require('SyntheticsLogger');
      
      const pageLoadBlueprint = async function () {
      
          const URL = "${url}";
      
          let page = await synthetics.getPage();
          const response = await page.goto(URL, {waitUntil: 'domcontentloaded', timeout: 30000});
          //Wait for page to render.
          //Increase or decrease wait time based on endpoint being monitored.
          await page.waitFor(15000);
          await synthetics.takeScreenshot('loaded', 'loaded');
          let pageTitle = await page.title();
          log.info('Page title: ' + pageTitle);
          if (response.status() !== 200) {
              throw "Failed to load page!";
          }
      };
      
      exports.handler = async () => {
          return await pageLoadBlueprint();
      };`;
  }
}