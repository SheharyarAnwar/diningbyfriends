import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as appsync from "@aws-cdk/aws-appsync";
import * as cognito from "@aws-cdk/aws-cognito";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as neptune from "@aws-cdk/aws-neptune";
import * as iam from "@aws-cdk/aws-iam";
export class DiningApiStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //Authentication
    const postConfirmationLambdaTrigger = new lambda.Function(
      this,
      "dining-app-sherry-post-confirmation-lambda",
      {
        runtime: lambda.Runtime.NODEJS_14_X,
        code: lambda.AssetCode.fromAsset("lambdas"),
        handler: "signup_trigger.handler",
      }
    );
    const userPool = new cognito.UserPool(this, "dining-app-sherry", {
      signInAliases: { email: true },
      autoVerify: {
        email: true,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      passwordPolicy: {
        minLength: 6,
      },
      selfSignUpEnabled: true,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      lambdaTriggers: {
        postConfirmation: postConfirmationLambdaTrigger,
      },
    });
    const userPoolClient = new cognito.UserPoolClient(
      this,
      "dining-app-sherry-user-client",
      {
        userPool,
      }
    );

    // Neptune Setup

    const vpc = new ec2.Vpc(this, "Vpc", {
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Ingress",
          subnetType: ec2.SubnetType.ISOLATED,
        },
      ],
    });
    const securityGroup = new ec2.SecurityGroup(
      this,
      "Security-Group-Neptune",
      {
        vpc: vpc,
        allowAllOutbound: true,
      }
    );
    securityGroup.addIngressRule(securityGroup, ec2.Port.tcp(8182));
    const subnetgroup = new neptune.CfnDBSubnetGroup(this, "Subnet-Group", {
      subnetIds: vpc.selectSubnets({ subnetType: ec2.SubnetType.ISOLATED })
        .subnetIds,
      dbSubnetGroupDescription:
        "I don't like anything but small letters in my name xD",
      dbSubnetGroupName: "neptune-subnet-sherry",
    });

    const cluster = new neptune.CfnDBCluster(this, "Cluster", {
      dbSubnetGroupName: subnetgroup.dbSubnetGroupName,
      // availabilityZones: vpc.availabilityZones,
      vpcSecurityGroupIds: [securityGroup.securityGroupId],
      dbClusterIdentifier: "neptune-db-cluster-identifier",
    });
    cluster.addDependsOn(subnetgroup);
    const db = new neptune.CfnDBInstance(this, "Neptune-DB", {
      dbInstanceClass: "db.t3.medium",
      dbClusterIdentifier: cluster.dbClusterIdentifier,
    });
    db.addDependsOn(cluster);
    const lambdaLayer = new lambda.LayerVersion(
      this,
      "Lambda-Layer-Neptune-Handler",
      {
        code: lambda.Code.fromAsset("lambda-layers"),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );
    const handler = new lambda.Function(this, "Lambda", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: new lambda.AssetCode("lambdas"),
      handler: "index.handler",
      layers: [lambdaLayer],
      vpc: vpc,
      timeout: cdk.Duration.seconds(30),
      securityGroups: [securityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.ISOLATED,
      },
    });
    handler.addEnvironment("NEPTUNE_ENDPOINT", db.attrEndpoint);
    handler.addEnvironment("NEPTUNE_PORT", db.attrPort);
    handler.addEnvironment("USE_IAM", "false");

    //Appsync

    const graphEndPoint = new appsync.GraphqlApi(this, "dining-sherry", {
      name: "diningbyfriends-endpoint",
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: userPool,
          },
        },
      },
      schema: appsync.Schema.fromAsset("schema/index.gql"),
    });
    const dataSource = graphEndPoint.addLambdaDataSource(
      "diningByFriendsDatasource",
      handler
    );
    //------------Resolvers

    //Mutations
    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "addPerson",
    });
    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "addRestaurant",
    });
    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "addCuisine",
    });
    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "addReview",
    });
    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "addFriend",
    });
    dataSource.createResolver({
      typeName: "Mutation",
      fieldName: "addRating",
    });

    //Queries

    dataSource.createResolver({
      typeName: "Query",
      fieldName: "friends",
    });
    dataSource.createResolver({
      typeName: "Query",
      fieldName: "friendsoffriends",
    });
    dataSource.createResolver({
      typeName: "Query",
      fieldName: "relation",
    });
    dataSource.createResolver({
      typeName: "Query",
      fieldName: "searchBestWithCusineAndLocation",
    });
    dataSource.createResolver({
      typeName: "Query",
      fieldName: "topTen",
    });
    dataSource.createResolver({
      typeName: "Query",
      fieldName: "latestReviews",
    });
    dataSource.createResolver({
      typeName: "Query",
      fieldName: "restaurantRecommendationsByFriends",
    });
    dataSource.createResolver({
      typeName: "Query",
      fieldName: "reviewedInLastXDays",
    });
    dataSource.createResolver({
      typeName: "Query",
      fieldName: "restaurantRating",
    });
  }
}
