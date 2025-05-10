# lab-ec2-cost-optimization
AWS Serverless

This project address rising AWS costs caused by non-production EC2 instances running overnight. Implemented a cost-effective solution to ensure instances tagged as env=dev and env=test run only during business hours (9 AM to 5 PM), while production instances (env=prod) remain available 24/7.


## Templaye.yaml

This AWS SAM template serves as the blueprint for deploying a serverless solution to automate EC2 instance management. At the core of this template is the Lambda function (EC2StartStopFunction), which is responsible for starting and stopping EC2 instances based on environment tags. The function is granted IAM permissions to perform EC2 actions, ensuring it has the necessary access. The EventBridge rules (StartEC2InstancesRule and StopEC2InstancesRule) act as schedulers, triggering the Lambda function at 9 AM and 5 PM to start and stop instances automatically. These rules pass structured JSON input, specifying the action ("start" or "stop") and the instance tags to be targeted. The Globals section enables structured logging and tracing, ensuring better observability. By defining the entire infrastructure in template.yaml, we have Infrastructure as Code (IaC), allowing for easy deployment, version control, and reproducibility across different AWS accounts.

## Lambda Function

This function dynamically identifies EC2 instances using tags passed as input from the EventBridge rule. Instead of hardcoding filters, the function extracts tags from the event JSON and formats them into EC2-compatible filter expressions. It then retrieves matching instances using DescribeInstancesCommand. If any instances are found, it executes either the StartInstancesCommand or StopInstancesCommand, depending on the action requested. The function logs each step using structured logging, ensuring that all execution details—such as retrieved instances, applied filters, and errors—are easily trackable in Amazon CloudWatch Logs. This event-driven, serverless approach not only saves costs by shutting down unnecessary instances but also follows best practices in cloud automation.

To simulate real-time execution, modified the EventBridge (CloudWatch) rules to trigger in the next 5-10 minutes. This allowed to observe automated start and stop events without waiting for the full schedule.

## Commands To:

### Get the Current UTC Time and Compute New Times:

export CURRENT_MINUTE=$(date -u +"%M")
export CURRENT_HOUR=$(date -u +"%H")
export STOP_MINUTE=$(( (CURRENT_MINUTE + 5) % 60 ))
export START_MINUTE=$(( (CURRENT_MINUTE + 10) % 60 ))
 
echo "Current Time (UTC): $CURRENT_HOUR:$CURRENT_MINUTE"
echo "Stopping Instances at: $CURRENT_HOUR:$STOP_MINUTE"
echo "Starting Instances at: $CURRENT_HOUR:$START_MINUTE"

### Update the stop rule:

aws events put-rule \
  --name StopEC2Instances \
  --schedule-expression "cron($STOP_MINUTE $CURRENT_HOUR * * ? *)"

### Update the start rule:

aws events put-rule \
  --name StartEC2Instances \
  --schedule-expression "cron($START_MINUTE $CURRENT_HOUR * * ? *)"

### Check the configured rules to ensure they will execute at the expected times:

aws events list-rules --name-prefix St

## Workflow Image:

![image](https://github.com/user-attachments/assets/a62849fe-9099-4d02-b5e0-e3dbdcdd5d46)
