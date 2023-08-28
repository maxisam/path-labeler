/* eslint-disable no-useless-escape */
import * as core from '@actions/core';
import { Octokit } from '@octokit/rest';
import { inspect } from 'util';
import { IInputs, INPUTS } from './modals';
export function getInputs(): IInputs {
  const inputs: IInputs = {
    authToken: core.getInput(INPUTS.authToken),
    prNumber: parseInt(core.getInput(INPUTS.prNumber), 10),
    prefixes: core.getInput(INPUTS.prefixes),
    delimiter: core.getInput(INPUTS.delimiter),
    layers: parseInt(core.getInput(INPUTS.layers), 10),
    basePaths: core.getInput(INPUTS.basePaths),
    debugShowPaths: core.getInput(INPUTS.debugShowPaths) === 'true',
    isDryRun: core.getInput(INPUTS.isDryRun) === 'true'
  };
  core.debug(`Inputs: ${inspect(inputs)}`);
  return inputs;
}

export function getOwnerRepo(owner: string, repository: string): [string, string] {
  if (repository.startsWith(`${owner}/`)) {
    const [repoOwner, repo] = repository.split('/');
    return [repoOwner, repo];
  }
  return [owner, repository];
}

export function getOctokit(authToken: string, userAgent = 'github-action'): Octokit | null {
  let octokit: Octokit | null = null;

  try {
    octokit = new Octokit({
      auth: authToken,
      userAgent,
      baseUrl: 'https://api.github.com',
      log: {
        debug: () => { },
        info: () => { },
        warn: console.warn,
        error: console.error
      },
      request: {
        agent: undefined,
        fetch: undefined,
        timeout: 0
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Error creating octokit:\n${error.message}`);
    }
  }
  return octokit;
}

export async function getPullRequestFiles(octokit: Octokit, owner: string, repo: string, pullNumber: number): Promise<string[]> {
  // https://octokit.github.io/rest.js/v19#pagination
  // will get 3000 files at a time
  return await octokit.paginate(octokit.pulls.listFiles, { owner, repo, pull_number: pullNumber }, response =>
    response.data.map(file => file.filename)
  );
}

export function getRegexPattern(base: string, layers: number): string {
  let token = `([^./]*)\/`;
  for (let i = 1; i < layers; i++) {
    token += token;
  }
  const pattern = `^(?:${base})\/${token}`;
  core.debug(`pattern: ${pattern}`);
  return pattern;
}
// return an array of tokens for each layer with the full path at the first index
// this will be used for output
export function getPathTokens(path: string, regexPattern: string): string[] {
  const regex = new RegExp(regexPattern);
  const found = path.match(regex);
  if (!found) {
    return [];
  }
  // remove the tailing slash
  return [found[0].slice(0, -1), ...found.slice(1)];
}
// first set is the full path
export function getTokenSets(filePaths: string[], pattern: string, layers: number, debugShowPaths: boolean): Set<string>[] {
  const labelTokenSets = [new Set<string>()];
  for (let i = 1; i <= layers; i++) {
    labelTokenSets.push(new Set<string>());
  }
  core.debug(`number of filePaths: ${filePaths.length}`);
  debugShowPaths && core.debug(`filePaths: ${inspect(filePaths)}`);
  for (const filePath of filePaths) {
    const tokens = getPathTokens(filePath, pattern);
    if (tokens.length !== layers + 1) {
      core.debug(`Tokens: ${inspect(tokens)}`);
    }
    // convert to for ... of loop
    for (const [index, token] of tokens.entries()) {
      labelTokenSets[index].add(token);
    }
  }

  return labelTokenSets;
}

export function getLabels(prefixes: string, delimiter: string, labelTokenSets: Set<string>[]): string[] {
  let prefixArray = labelTokenSets.map(() => '');
  if (prefixes !== '') {
    if (prefixArray.length !== labelTokenSets.length) {
      core.error(`The number of prefixes (${prefixArray.length}) does not match the number of layers (${labelTokenSets.length})`);
    } else {
      prefixArray = prefixes.split('|');
    }
  }
  const labels = labelTokenSets.map((labelTokenSet, index) => {
    let prefix = prefixArray[index];
    if (prefix !== '') {
      prefix += delimiter;
    }
    const labelTokens = Array.from(labelTokenSet);
    return labelTokens.map(labelToken => `${prefix}${labelToken}`.trim());
  });
  return labels.flat();
}
