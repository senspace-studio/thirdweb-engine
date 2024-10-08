// Anvil chain outputs every RPC call to stdout
// You can save the output to a file and then use this script to count the number of times a specific RPC call is made.

import { argv } from "bun";
import { readFile } from "fs/promises";
import { join } from "path";

const file = join(__dirname, argv[2]);

async function countLines(file: string) {
  const data = await readFile(file, "utf-8");
  const lines = data.split("\n");
  const statements = new Map<string, number>();

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    if (statements.has(line)) {
      statements.set(line, statements.get(line)! + 1);
    } else {
      statements.set(line, 1);
    }
  }

  return statements;
}

countLines(file).then((lines) => {
  for (const [line, count] of lines) {
    console.log(`${line}: ${count}`);
  }
});
