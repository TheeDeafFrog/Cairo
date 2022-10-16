import * as cdk from 'aws-cdk-lib';
import { 
  aws_s3 as s3
} from 'aws-cdk-lib';
import { generatePipeline } from './pipeline';

export class CairoFrontendStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const prodBucket = new s3.Bucket(this, 'prodBucket', {
      bucketName: 'cv.kevinr.net'
    });

    const betaBucket = new s3.Bucket(this, 'betaBucket', {
      bucketName: 'beta.cv.kevinr.net'
    });

    generatePipeline(this, betaBucket);
  }
}
