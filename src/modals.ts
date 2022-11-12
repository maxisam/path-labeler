export enum INPUTS {
  authToken = 'authToken',
  prNumber = 'prNumber',
  prefixes = 'prefixes',
  delimiter = 'delimiter',
  layers = 'layers',
  basePaths = 'basePaths'
}

export interface IInputs {
  authToken: string;
  prNumber: number;
  prefixes: string;
  delimiter: string;
  layers: number;
  basePaths: string;
}
