## How to create a bucket in AWS S3

https://docs.aws.amazon.com/AmazonS3/latest/userguide/creating-bucket.html

## How to generate credentials for AWS

IAM -> Users => Add User -> user name -> Next
-> Attach Policies Directly -> permission Policies -> AmazonS3FullAccess
-> Next -> Create User -> username -> create access key -> Use case: CLI
-> Next Create access key -> Access key ID -> Secret access key

## How to push Docker image to ECR

ecr repo -> view push command -> interactive login CLI
sudo docker build -t <image-name> .
docker tag <image-name> <aws-account-id>.dkr.ecr.<region>.amazonaws.com/<image-name>
docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/<image-name>

## Creating an Amazon ECS cluster for the Fargate launch type

https://docs.aws.amazon.com/AmazonECS/latest/developerguide/create-cluster-console-v2.html

copy ecr URI
ECS -> Task definition -> create new task defination -> Fargate -> OS -> ARM64
-> task size -> add container -> image -> <ecr URI>
-> remove port mapping(nothing exposed) -> add -> create -> run task
