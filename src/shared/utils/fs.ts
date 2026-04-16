import { readdirSync, Dirent } from 'node:fs';
import { join } from 'node:path';

const listAllPathsSync = (rootDirectory: string): string[] => {
  const collectedPaths: string[] = [];

  const walk = (absoluteDirectoryPath: string, relativeBasePath: string): void => {
    let entries: Dirent[];
    try {
      entries = readdirSync(absoluteDirectoryPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const absoluteEntryPath = join(absoluteDirectoryPath, entry.name);
      const relativeEntryPath = relativeBasePath ? join(relativeBasePath, entry.name) : entry.name;

      collectedPaths.push(relativeEntryPath);

      if (entry.isDirectory()) {
        walk(absoluteEntryPath, relativeEntryPath);
      }
    }
  };

  walk(rootDirectory, '');
  return collectedPaths;
};

const printAllPathsSync = (rootDirectory: string): void => {
  const paths = listAllPathsSync(rootDirectory);
  // basic logs to validate behavior and counts
  console.log(`[fs:list] root: ${rootDirectory} | total entries: ${paths.length}`);
  for (const path of paths) {
    console.log(path);
  }
};

export { listAllPathsSync, printAllPathsSync };


