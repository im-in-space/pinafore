import { actions } from './mastodon-data'
import { users } from '../tests/users'
import { postStatus } from '../src/routes/_api/statuses'
import { followAccount } from '../src/routes/_api/follow'
import { favoriteStatus } from '../src/routes/_api/favorite'
import { reblogStatus } from '../src/routes/_api/reblog'
import fetch from 'node-fetch'
import FileApi from 'file-api'
import { pinStatus } from '../src/routes/_api/pin'
import { submitMedia } from '../tests/submitMedia'

global.File = FileApi.File
global.FormData = FileApi.FormData
global.fetch = fetch

export async function restoreMastodonData () {
  console.log('Restoring mastodon data...')
  const internalIdsToIds = {}
  for (const action of actions) {
    if (!action.post) {
      // If the action is a boost, favorite, etc., then it needs to
      // be delayed, otherwise it may appear in an unpredictable order and break the tests.
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    console.log(JSON.stringify(action))
    const accessToken = users[action.user].accessToken

    if (action.post) {
      const { text, media, sensitive, spoiler, privacy, inReplyTo, internalId } = action.post
      const mediaIds = media && await Promise.all(media.map(async mediaItem => {
        const mediaResponse = await submitMedia(accessToken, mediaItem, 'kitten')
        return mediaResponse.id
      }))
      const inReplyToId = inReplyTo && internalIdsToIds[inReplyTo]
      const status = await postStatus('localhost:3000', accessToken, text, inReplyToId, mediaIds,
        sensitive, spoiler, privacy || 'public')
      if (typeof internalId !== 'undefined') {
        internalIdsToIds[internalId] = status.id
      }
    } else if (action.follow) {
      await followAccount('localhost:3000', accessToken, users[action.follow].id)
    } else if (action.favorite) {
      await favoriteStatus('localhost:3000', accessToken, internalIdsToIds[action.favorite])
    } else if (action.boost) {
      await reblogStatus('localhost:3000', accessToken, internalIdsToIds[action.boost])
    } else if (action.pin) {
      await pinStatus('localhost:3000', accessToken, internalIdsToIds[action.pin])
    }
  }
  console.log('Restored mastodon data')
}
