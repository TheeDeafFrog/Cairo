import * as cdk from 'aws-cdk-lib';
import { 
  aws_s3 as s3,
  aws_cloudfront as cloudfront,
  aws_certificatemanager as certificateManager,
  aws_route53 as route53,
  Duration
} from 'aws-cdk-lib';
import { CachePolicy, PriceClass } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { HostedZone } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
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

    const hostedZone = HostedZone.fromHostedZoneId(this, 'kevinr.net', process.env.hostedZone as string);
    
    const certificate = new certificateManager.DnsValidatedCertificate(this, 'betaCertificate', {
      domainName: 'cv.kevinr.net',
      hostedZone: hostedZone,
      region: 'us-east-1',
      subjectAlternativeNames: ['beta.cv.kevinr.net', 'www.kevinr.net']
    });

    const betaDistribution = new cloudfront.Distribution(this, 'cairoBeta', {
      defaultBehavior: {
        origin: new S3Origin(betaBucket),
        cachePolicy: CachePolicy.CACHING_DISABLED
      },
      certificate: certificate,
      defaultRootObject: 'index.html',
      domainNames: ['beta.cv.kevinr.net'],
      priceClass: PriceClass.PRICE_CLASS_100,
    });

    new route53.ARecord(this, 'cvBetaRecord', {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new CloudFrontTarget(betaDistribution)),
      recordName: 'beta.cv.kevinr.net',
      ttl: Duration.minutes(10)
    });

    const prodDistribution = new cloudfront.Distribution(this, 'cairoProd', {
      defaultBehavior: {
        origin: new S3Origin(prodBucket),
        cachePolicy: CachePolicy.CACHING_DISABLED
      },
      certificate: certificate,
      defaultRootObject: 'index.html',
      domainNames: ['cv.kevinr.net', 'www.kevinr.net'],
      priceClass: PriceClass.PRICE_CLASS_100,
    });

    const prodTarget = route53.RecordTarget.fromAlias(new CloudFrontTarget(prodDistribution));

    ['www.kevinr.net', 'cv.kevinr.net'].forEach((recordName) => {
      new route53.ARecord(this, 'cvRecord', {
        zone: hostedZone,
        target: prodTarget,
        recordName: recordName
      });
    });
  }
}
