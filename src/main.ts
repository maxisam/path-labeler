import * as core from '@actions/core';
import {inspect} from 'util';
import {getInputs, getLabels, getOctokit, getOwnerRepo, getPullRequestFiles, getRegexPattern, getTokenSets} from './common';
import {createActionRequest, IRequestPayload} from './create-action-request';

async function run(): Promise<void> {
  const inputs = getInputs();
  const [owner, repo] = getOwnerRepo(process.env.GITHUB_REPOSITORY_OWNER || '', process.env.GITHUB_REPOSITORY || '');
  const octokit = getOctokit(inputs.authToken, 'github-action');
  let request = {} as IRequestPayload;
  if (octokit) {
    try {
      const filePaths = await getPullRequestFiles(octokit, owner, repo, inputs.prNumber);
      const pattern = getRegexPattern(inputs.basePaths, inputs.layers);
      const tokenSets = getTokenSets(filePaths, pattern, inputs.layers, inputs.debugShowPaths);
      core.setOutput('paths', Array.from(tokenSets[0]));
      // only get sets for labels
      const labels = getLabels(inputs.prefixes, inputs.delimiter, tokenSets.slice(1));
      core.setOutput('labels', labels);
      if (!labels.length) {
        core.info('No labels found');
        return;
      }
      request = createActionRequest(owner, repo, inputs.prNumber, labels);
      core.debug(`dispatch event request: ${inspect(request)}`);
    } catch (error) {
      if (error instanceof Error) {
        core.setFailed(`Error for creating the request object: ${error.message}`);
      }
      return;
    }
  }
  if (octokit === null) {
    core.setFailed('Error creating octokit:\noctokit was null');
  } else {
    try {
      // github add labels to pull request
      await octokit.issues.addLabels(request);
    } catch (error) {
      core.debug(inspect(error));
      if (error instanceof Error) {
        core.setFailed(`Error setting status:\n${error.message}\nRequest object:\n${JSON.stringify(request, null, 2)}`);
      }
    }
  }
}

run();
