import {Endpoints, RequestParameters} from '@octokit/types';

export type IRequestPayload = RequestParameters &
  Omit<Endpoints['POST /repos/{owner}/{repo}/issues/{issue_number}/labels']['parameters'], 'baseUrl' | 'headers' | 'mediaType'>;

export function createActionRequest(owner: string, repo: string, eventNumber: number, labels: string[]): IRequestPayload {
  return {
    owner,
    repo,
    issue_number: eventNumber,
    labels
  };
}
