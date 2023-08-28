export enum INPUTS {
  authToken = 'authToken',
  prNumber = 'prNumber',
  prefixes = 'prefixes',
  delimiter = 'delimiter',
  layers = 'layers',
  basePaths = 'basePaths',
  debugShowPaths = 'debugShowPaths',
  isDryRun = 'isDryRun'
}

export interface IInputs {
  authToken: string;
  prNumber: number;
  prefixes: string;
  delimiter: string;
  layers: number;
  basePaths: string;
  debugShowPaths: boolean;
  isDryRun: boolean;
}
