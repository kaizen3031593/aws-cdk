import * as s3 from '@aws-cdk/aws-s3';
import * as s3_assets from '@aws-cdk/aws-s3-assets'
import { Construct } from '@aws-cdk/core';
import * as path from 'path';

/**
 * The custom code the canary should run
 */
export abstract class Code {

  /**
   * Specify code inline
   *
   * @returns `InlineCode` with inline code.
   * @param code The actual handler code (limited to 4KiB)
   */
  public static fromInline(code: string): InlineCode {
    return new InlineCode(code);
  }
  /**
   * TODO implement `fromAsset()`
   */
  public static fromAsset(path: string, options?: s3_assets.AssetOptions): AssetCode {
    return new AssetCode(path, options);
  }

  /**
   * @returns `S3Code` associated with the specified S3 object.
   * @param bucket The S3 bucket
   * @param key The object key
   * @param objectVersion Optional S3 object version
   */
  // public static fromBucket(bucket: s3.IBucket, key: string, objectVersion?: string): S3Code {
  //   return new S3Code(bucket, key, objectVersion);
  // }

  /**
   * Called when the canary is initialized to allow this object to bind
   * to the stack, add resources and have fun.
   *
   * @param scope The binding scope. Don't be smart about trying to down-cast or
   * assume it's initialized. You may just use it as a construct scope.
   */
  public abstract bind(scope: Construct): CodeConfig;
}

/**
 * Configuration of the code class
 */
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

export class AssetCode extends Code {
  private asset: s3_assets.Asset | undefined;
  constructor(private assetPath: string, private options: s3_assets.AssetOptions){
    super();

    const directories = path.parse(assetPath).dir.split(path.sep);
    if (directories.length < 2 || directories[0] !== 'nodejs' || directories[1] !== 'node_modules'){
      throw new Error('Asset must have the file path \'nodejs/node_modules\'');
    }
  }

  public bind(scope: Construct): CodeConfig {
    if (this.asset){
      throw new Error('Asset already defined');
    }

    this.asset = new s3_assets.Asset(scope, 'Asset', {
      path: this.assetPath,
      ...this.options,
    });

    return {
      s3Location: {
        bucketName: this.asset.s3BucketName,
        objectKey: this.asset.s3ObjectKey,
      },
    };
  }
}

/**
 * Canary code from an inline string (limited to 4KiB).
 */
export class InlineCode extends Code {
  constructor(private code: string) {
    super();

    if (code.length === 0) {
      throw new Error('Canary inline code cannot be empty');
    }

    if (code.length > 4096) {
      throw new Error('Canary source is too large, must be <= 4096 but is ' + code.length);
    }
  }

  public bind(_scope: Construct): CodeConfig {
    return {
      inlineCode: this.code,
    };
  }
}
