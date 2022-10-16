#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CairoFrontendStack } from '../src/frontend/stack';

const env = { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
};

const app = new cdk.App();
new CairoFrontendStack(app, 'CairoFrontendStack', {env}); 