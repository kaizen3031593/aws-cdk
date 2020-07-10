import * as s3 from '@aws-cdk/aws-s3';
import * as s3_assets from '@aws-cdk/aws-s3-assets';
import * as cdk from '@aws-cdk/core';
import * as fs from 'fs';
import * as archiver from 'archiver';
import * as path from 'path';

/**
 * The code of the canary. Currently only supports inline code.
 */
export abstract class Code {
  /**
   * Specify Code parameter from inline.
   *
   * @returns `CanaryInlineCode` with inline code.
   * @param code The actual handler code (limited to 4KiB)
   */
  public static fromInline(code: string): InlineCode {
    return new InlineCode(code);
  }

  public static fromAsset(path: string, options?: s3_assets.AssetOptions): AssetCode {
    return new AssetCode(path, options);
  }

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
  public abstract bind(scope: cdk.Construct): CodeConfig;

  public bindToResource(_resource: cdk.CfnResource, _options?: ResourceBindOptions) {
    return;
  }
}

/**
 * Canary code from a local directory.
 */
export class AssetCode extends Code {
  public readonly isInline = false;
  private asset?: s3_assets.Asset;

  /**
   * @param path The path to the asset file or directory.
   */
  constructor(public readonly path: string, private readonly options: s3_assets.AssetOptions = { }) {
    super();
  }

  public bind(scope: cdk.Construct): CodeConfig {
    // If the same AssetCode is used multiple times, retain only the first instantiation.
    if (!this.asset) {
      this.asset = this.createAsset(scope);
    }

    // Can remove probably
    if (!this.asset.isZipArchive) {
      throw new Error(`Asset must be a .zip file or a directory (${this.path})`);
    }

    return {
      s3Location: {
        bucketName: this.asset.s3BucketName,
        objectKey: this.asset.s3ObjectKey,
      },
    };
  }

  private createAsset(scope: cdk.Construct): s3_assets.Asset {
    const internalZipPath = 'nodejs/node_modules';

    var output = fs.createWriteStream(this.path + '/nodejs.zip');
    var archive = archiver('zip', {});
    archive.pipe(output);
    
    const filesToAdd = fs.readdirSync(this.path);

    filesToAdd.forEach((file) => {
      const pathToFile = path.join(this.path, file);
      archive.file(pathToFile, {
        name: path.join(internalZipPath, file),
      }); 
    });
    archive.finalize();

    return new s3_assets.Asset(scope, 'Code', {
      path: output.path as string,
      ...this.options,
    });
  }

  public bindToResource(resource: cdk.CfnResource, options: ResourceBindOptions = { }) {
    if (!this.asset) {
      throw new Error('bindToResource() must be called after bind()');
    }

    const resourceProperty = options.resourceProperty || 'Code';

    // https://github.com/aws/aws-cdk/issues/1432
    this.asset.addResourceMetadata(resource, resourceProperty);
  }
}

export interface ResourceBindOptions {
  readonly resourceProperty?: string;
}

/**
 * Codeconfig
 */
export interface CodeConfig {
  /**
   * The location of the code in S3 (mutually exclusive with `inlineCode`).
   *
   * @default none
   */
  readonly s3Location?: s3.Location;

  /**
   * Inline code (mutually exclusive with `s3Location`).
   *
   * @default none
   */
  readonly inlineCode?: string;
}

export class S3Code extends Code {
  public readonly isInline = false;
  private bucketName: string;

  constructor(bucket: s3.IBucket, private key: string, private objectVersion?: string) {
    super();

    if (!bucket.bucketName) {
      throw new Error('bucketName is undefined for the provided bucket');
    }

    this.bucketName = bucket.bucketName;
  }

  public bind(_scope: cdk.Construct): CodeConfig {
    return {
      s3Location: {
        bucketName: this.bucketName,
        objectKey: this.key,
        objectVersion: this.objectVersion,
      },
    };
  }
}

/**
 * InlineCode
 */
export class InlineCode extends Code {
  public readonly isInline = true;

  constructor(private code: string) {
    super();

    if (code.length === 0) {
      throw new Error('Canary inline code cannot be empty');
    }

    if (code.length > 4096) {
      throw new Error('Canary source is too large, must be <= 4096 but is ' + code.length);
    }
  }

  /**
   * Bind to the resource
   *
   * @param _scope - the construct
   */
  public bind(_scope: cdk.Construct): CodeConfig {
    return {
      inlineCode: this.code,
    };
  }
}