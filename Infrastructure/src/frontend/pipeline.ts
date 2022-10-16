import {
    aws_s3 as s3,
    aws_codepipeline as pipelines,
    aws_codepipeline_actions as actions,
    aws_codestarconnections as csConnections,
    aws_codebuild as codeBuild,
} from 'aws-cdk-lib';
import { ComputeType } from 'aws-cdk-lib/aws-codebuild';
import { Construct } from 'constructs';

export function generatePipeline(scope: Construct, betaBucket: s3.Bucket) {
    const pipeline = new pipelines.Pipeline(scope, 'fePipeline', {
        pipelineName: 'cairoFrontendPipeline',
        crossAccountKeys: false
    });

    new csConnections.CfnConnection(scope, 'githubConnection', {
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
        connectionArn: 'arn:aws:codestar-connections:us-east-1:949565233592:connection/c24685e7-5ed5-42b1-b741-8689f2e948cf'
    });

    pipeline.addStage({
        stageName: 'Source',
        actions: [sourceAction]
    });

    const codeBuildProject = new codeBuild.PipelineProject(scope, 'cairoBuild', {
        buildSpec: codeBuild.BuildSpec.fromObject({
            version: '0.2',
            phases: {
                install: {
                    'runtime-versions': {
                        node: '16'
                    },
                    commands: [
                        'cd Frontend/cairo',
                        'npm install'
                    ]
                },
                pre_build: {
                    commands: [
                        'CI=true npm test'
                    ]
                },
                build: {
                    commands: [
                        'CI=true npm run build'
                    ]
                }
            },
            artifacts: {
                files: [
                    'Frontend/cairo/build/**/*'
                ]
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

    return pipeline;
}