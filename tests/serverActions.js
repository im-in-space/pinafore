import { favoriteStatus } from '../src/routes/_api/favorite'
import fetch from 'node-fetch'
import FileApi from 'file-api'
import { users } from './users'
import { postStatus } from '../src/routes/_api/statuses'
import { deleteStatus } from '../src/routes/_api/delete'
import { authorizeFollowRequest, getFollowRequests } from '../src/routes/_api/followRequests'
import { followAccount, unfollowAccount } from '../src/routes/_api/follow'
import { updateCredentials } from '../src/routes/_api/updateCredentials'
import { reblogStatus } from '../src/routes/_api/reblog'
import { submitMedia } from './submitMedia'
import { voteOnPoll } from '../src/routes/_api/polls'
import { POLL_EXPIRY_DEFAULT } from '../src/routes/_static/polls'

global.fetch = fetch
global.File = FileApi.File
global.FormData = FileApi.FormData

const instanceName = 'localhost:3000'

export async function favoriteStatusAs (username, statusId) {
  return favoriteStatus(instanceName, users[username].accessToken, statusId)
}

export async function reblogStatusAs (username, statusId) {
  return reblogStatus(instanceName, users[username].accessToken, statusId)
}

export async function postAs (username, text) {
  return postStatus(instanceName, users[username].accessToken, text,
    null, null, false, null, 'public')
}

export async function postWithSpoilerAndPrivacyAs (username, text, spoiler, privacy) {
  return postStatus(instanceName, users[username].accessToken, text,
    null, null, true, spoiler, privacy)
}

export async function postEmptyStatusWithMediaAs (username, filename, alt, sensitive) {
  const mediaResponse = await submitMedia(users[username].accessToken, filename, alt)
  return postStatus(instanceName, users[username].accessToken, '',
    null, [mediaResponse.id], !!sensitive, null, 'public')
}

export async function postReplyAs (username, text, inReplyTo) {
  return postStatus(instanceName, users[username].accessToken, text,
    inReplyTo, null, false, null, 'public')
}

export async function deleteAs (username, statusId) {
  return deleteStatus(instanceName, users[username].accessToken, statusId)
}

export async function getFollowRequestsAs (username) {
  return getFollowRequests(instanceName, users[username].accessToken)
}

export async function authorizeFollowRequestAs (username, id) {
  return authorizeFollowRequest(instanceName, users[username].accessToken, id)
}

export async function followAs (username, userToFollow) {
  return followAccount(instanceName, users[username].accessToken, users[userToFollow].id)
}

export async function unfollowAs (username, userToFollow) {
  return unfollowAccount(instanceName, users[username].accessToken, users[userToFollow].id)
}

export async function updateUserDisplayNameAs (username, displayName) {
  return updateCredentials(instanceName, users[username].accessToken, { display_name: displayName })
}

export async function createPollAs (username, content, options, multiple) {
  return postStatus(instanceName, users[username].accessToken, content, null, null, false, null, 'public', {
    options,
    multiple,
    expires_in: POLL_EXPIRY_DEFAULT
  })
}

export async function voteOnPollAs (username, pollId, choices) {
  return voteOnPoll(instanceName, users[username].accessToken, pollId, choices.map(_ => _.toString()))
}
