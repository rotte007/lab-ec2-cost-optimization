import { EC2Client, DescribeInstancesCommand, StartInstancesCommand, StopInstancesCommand } from "@aws-sdk/client-ec2";

const ec2 = new EC2Client({});
const log = (level, message, data = {}) => {
  console.log({ level, message, ...data });
};

export const lambdaHandler = async (event) => {
  const action = event.action || "stop";
  const tags = event.tags || { env: "dev,test" };

  const filters = Object.entries(tags).map(([key, value]) => ({
    Name: `tag:${key}`,
    Values: value.split(","),
  }));

  try {
    log("INFO", "Fetching EC2 instances with specified tags", { filters });

    const data = await ec2.send(new DescribeInstancesCommand({ Filters: filters }));
    const instanceIds = data.Reservations.flatMap((reservation) =>
      reservation.Instances.map((instance) => instance.InstanceId)
    );

    if (instanceIds.length > 0) {
      log("INFO", `Instances identified for ${action}`, { instanceIds });

      if (action === "start") {
        await ec2.send(new StartInstancesCommand({ InstanceIds: instanceIds }));
        log("INFO", "Instances started successfully", { instanceIds });
      } else {
        await ec2.send(new StopInstancesCommand({ InstanceIds: instanceIds }));
        log("INFO", "Instances stopped successfully", { instanceIds });
      }
    } else {
      log("INFO", "No matching instances found", { action, tags });
    }
  } catch (error) {
    log("ERROR", "Error managing EC2 instances", { error: error.message });
  }
};