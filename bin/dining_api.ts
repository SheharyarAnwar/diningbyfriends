#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DiningApiStack } from '../lib/dining_api-stack';

const app = new cdk.App();
new DiningApiStack(app, 'DiningApiStack');
