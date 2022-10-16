#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CairoFrontendStack } from '../src/frontend/stack';

const app = new cdk.App();
new CairoFrontendStack(app, 'CairoFrontendStack');