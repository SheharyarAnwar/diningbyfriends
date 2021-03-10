import { Context, Callback } from "aws-lambda";
import { Lambda } from "aws-sdk";
exports.handler = async (event: any, context: Context, callback: Callback) => {
  console.log("trigger");
  callback(null, event);
};
