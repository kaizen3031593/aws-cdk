import * as path from 'path';
import * as iam from '@aws-cdk/aws-iam';
import * as s3 from '@aws-cdk/aws-s3';
import * as s3_assets from '@aws-cdk/aws-s3-assets';
import { Construct } from '@aws-cdk/core';

/**
 * The custom code the canary should run
 */
export abstract class Code {

  /**
   * Specify code inline.
   *
   * @returns `InlineCode` with inline code.
   * @param code The actual handler code (limited to 4KiB)
   */
  public static fromInline(code: string): InlineCode {
    return new InlineCode(code);
  }
  /**
   * Specify code from a local path. Path must include the folder structure `nodejs/node_modules`
   *
   * @returns `AssetCode` associated with the specified path.
   * @param assetPath Either a directory or a .zip file
   */
  public static fromAsset(assetPath: string, options?: s3_assets.AssetOptions): AssetCode {
    return new AssetCode(assetPath, options);
  }

  /**
   * Specify code from an s3 bucket.
   *
   * @returns `S3Code` associated with the specified S3 object.
   * @param bucket The S3 bucket
   * @param key The object key
   * @param objectVersion Optional S3 object version
   */
  public static fromBucket(bucket: s3.IBucket, key: string, objectVersion?: string): S3Code {
    return new S3Code(bucket, key, objectVersion);
  }

  /**
   * Called when the canary is initialized to allow this object to bind
   * to the stack, add resources and have fun.
   *
   * @param scope The binding scope. Don't be smart about trying to down-cast or
   * assume it's initialized. You may just use it as a construct scope.
   */
  public abstract bind(scope: Construct, role: iam.IGrantable): CodeConfig;
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
  private asset?: s3_assets.Asset;

  /**
   * @param assetPath The path to the asset file or directory.
   */
  constructor(private assetPath: string, private options?: s3_assets.AssetOptions){
    super();

    //TODO: check if this can be endsWith
    if (path.extname(assetPath) !== '.zip' && !assetPath.includes(`nodejs${path.sep}node_modules`)){
      throw new Error(`Asset must have the file path \'nodejs${path.sep}node_modules\'`);
    }
  }

  //TODO: check if role works
  public bind(scope: Construct, role: iam.IGrantable): CodeConfig {
    // If the same AssetCode is used multiple times, retain only the first instantiation.
    if (!this.asset){
      this.asset = new s3_assets.Asset(scope, 'Code', {
        path: this.assetPath,
        ...this.options,
        readers: [role],
      });
    }

    if (!this.asset.isZipArchive) {
      throw new Error(`Asset must be a .zip file or a directory (${this.assetPath})`);
    }

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

    if (code.length > 460800) {
      throw new Error('Canary source is too large, must be <= 460800 but is ' + code.length);
    }
  }

  public bind(_scope: Construct, _role: iam.IGrantable): CodeConfig {
    return {
      inlineCode: this.code,
    };
  }
}

/**
 * Canary code from an S3 archive.
 */
export class S3Code extends Code {
  private bucketName: string;

  constructor(bucket: s3.IBucket, private key: string, private objectVersion?: string) {
    super();

    if (!bucket.bucketName) {
      throw new Error('bucketName is undefined for the provided bucket');
    }

    this.bucketName = bucket.bucketName;
  }

  public bind(_scope: Construct, _role: iam.IGrantable): CodeConfig {
    return {
      s3Location: {
        bucketName: this.bucketName,
        objectKey: this.key,
        objectVersion: this.objectVersion,
      },
    };
  }
}