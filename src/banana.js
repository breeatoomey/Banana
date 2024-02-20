import * as fs from "node:fs/promises";
import process from "node:process";
import parse from "./parser.js";

if (process.argv.length !== 3) {
  console.log("Must have exactly one argument: the filename of the program to compile.");
} else {
  try {
    const buffer = await fs.readFile(process.argv[2]);
    parse(buffer.toString());
    console.log("Syntax ok");
  } catch (e) {
    console.error(`\u001b[31m${e}\u001b[39m`);
  }
}
