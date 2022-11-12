import * as cdk from 'aws-cdk-lib';
import {
    aws_s3 as s3,
    aws_codepipeline as pipelines,
    aws_codepipeline_actions as actions,
    aws_codestarconnections as csConnections,
    aws_codebuild as codeBuild,
} from 'aws-cdk-lib';
import { ComputeType } from 'aws-cdk-lib/aws-codebuild';

export function generatePipeline(scope: cdk.Stack, betaBucket: s3.Bucket, prodBucket: s3.Bucket) {
    const pipeline = new pipelines.Pipeline(scope, 'CairoPipeline', {
        pipelineName: 'cairoFrontendPipeline',
        crossAccountKeys: false
    });

    const connection = new csConnections.CfnConnection(scope, 'CairoGithubConnection', {
        connectionName: 'cairoConnection',
        providerType: 'GitHub'
    });

    const sourceOutput = new pipelines.Artifact();
    const sourceAction = new actions.CodeStarConnectionsSourceAction({
        actionName: 'githubSource',
        owner: 'TheeDeafFrog',
        repo: 'Cairo',
        branch: 'release',
        output: sourceOutput,
        connectionArn: connection.attrConnectionArn
    });

    pipeline.addStage({
        stageName: 'Source',
        actions: [sourceAction]
    });

    const codeBuildProject = new codeBuild.PipelineProject(scope, 'CairoBuild', {
        buildSpec: codeBuild.BuildSpec.fromObject({
            version: '0.2',
            phases: {
                install: {
                    'runtime-versions': {
                        node: 'latest'
                    },
                    commands: [
                        'npm install'
                    ]
                },
                pre_build: {
                    commands: [
                        'npm run test'
                    ]
                },
                build: {
                    commands: [
                        'npm run build'
                    ]
                }
            },
            artifacts: {
                files: [
                    '**/*'
                ],
                'base-directory': 'dist'
            },
        }),
        environment:{
            computeType: ComputeType.SMALL
        }
    });

    const buildOutput = new pipelines.Artifact();
    const buildAction = new actions.CodeBuildAction({
        actionName: 'build',
        project: codeBuildProject,
        input: sourceOutput,
        outputs: [buildOutput]
    });

    pipeline.addStage({
        stageName: 'Build',
        actions: [buildAction]
    });

    const betaDeploy = new actions.S3DeployAction({
        actionName: 'betaDeploy',
        bucket: betaBucket,
        input: buildOutput
    });

    pipeline.addStage({
        stageName: 'Beta',
        actions: [betaDeploy]
    });

    const manualApprovalAction = new actions.ManualApprovalAction({
        actionName: 'prodPromotion'
    });

    pipeline.addStage({
        stageName: 'ProdPromotion',
        actions: [manualApprovalAction]
    });

    const adminUser = cdk.aws_iam.User.fromUserName(scope, 'AdminUser', 'Admin');
    manualApprovalAction.grantManualApproval(adminUser);

    const prodDeploy = new actions.S3DeployAction({
        actionName: 'prodDeploy',
        bucket: prodBucket,
        input: buildOutput
    });

    pipeline.addStage({
        stageName: 'Prod',
        actions: [prodDeploy]
    });

    return pipeline;
}