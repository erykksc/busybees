import { Resource } from "sst";
import { Example } from "@busybees/core/example";

console.log(`${Example.hello()} Linked to ${Resource.MyBucket.name}.`);
