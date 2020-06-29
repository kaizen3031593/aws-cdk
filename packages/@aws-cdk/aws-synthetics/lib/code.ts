import * as s3 from '@aws-cdk/aws-s3';
import { Construct } from '@aws-cdk/core';

/**
 * The code of the canary. Currently only supports inline code.
 */
export abstract class Code {
  /**
   * @returns `CanaryInlineCode` with inline code.
   * @param code The actual handler code (limited to 4KiB)
   */
  public static fromInline(code: string): InlineCode {
    return new InlineCode(code);
  }

  /**
   * Called when the canary is initialized to allow this object to bind
   * to the stack, add resources and have fun.
   *
   * @param scope The binding scope. Don't be smart about trying to down-cast or
   * assume it's initialized. You may just use it as a construct scope.
   */
  public abstract bind(scope: Construct): CodeConfig;

}

export interface CodeConfig {
  /**
   * The location of the code in S3 (mutually exclusive with `inlineCode`).
   */
  readonly s3Location?: s3.Location;

  /**
   * Inline code (mutually exclusive with `s3Location`).
   */
  readonly inlineCode?: string;
}

export class InlineCode extends Code {
  constructor(private code: string) {
    super();

    if(code.length === 0) {
      throw new Error('Canary inline code cannot be empty');
    }

    if(code.length > 4096) {
      throw new Error('Canary source is too large, must be <= 4096 but is ' + code.length);
    }
  }

  public bind(_scope: Construct): CodeConfig {
    return {
      inlineCode: this.code,
    }
  };
}