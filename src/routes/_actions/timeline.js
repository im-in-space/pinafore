import { store } from '../_store/store'
import { getTimeline } from '../_api/timelines'
import { toast } from '../_components/toast/toast'
import { mark, stop } from '../_utils/marks'
import { concat, mergeArrays } from '../_utils/arrays'
import { compareTimelineItemSummaries } from '../_utils/statusIdSorting'
import isEqual from 'lodash-es/isEqual'
import { database } from '../_database/database'
import { getStatus, getStatusContext } from '../_api/statuses'
import { emit } from '../_utils/eventBus'
import { TIMELINE_BATCH_SIZE } from '../_static/timelines'
import { timelineItemToSummary } from '../_utils/timelineItemToSummary'

async function storeFreshTimelineItemsInDatabase (instanceName, timelineName, items) {
  await database.insertTimelineItems(instanceName, timelineName, items)
  if (timelineName.startsWith('status/')) {
    // For status threads, we want to be sure to update the favorite/reblog counts even if
    // this is a stale "view" of the status. See 119-status-counts-update.js for
    // an example of why we need this.
    items.forEach(item => {
      emit('statusUpdated', item)
    })
  }
}

async function fetchTimelineItemsFromNetwork (instanceName, accessToken, timelineName, lastTimelineItemId) {
  if (timelineName.startsWith('status/')) { // special case - this is a list of descendents and ancestors
    const statusId = timelineName.split('/').slice(-1)[0]
    const statusRequest = getStatus(instanceName, accessToken, statusId)
    const contextRequest = getStatusContext(instanceName, accessToken, statusId)
    const [status, context] = await Promise.all([statusRequest, contextRequest])
    return concat(context.ancestors, status, context.descendants)
  } else { // normal timeline
    return getTimeline(instanceName, accessToken, timelineName, lastTimelineItemId, null, TIMELINE_BATCH_SIZE)
  }
}

async function fetchTimelineItems (instanceName, accessToken, timelineName, lastTimelineItemId, online) {
  mark('fetchTimelineItems')
  let items
  let stale = false
  if (!online) {
    items = await database.getTimeline(instanceName, timelineName, lastTimelineItemId, TIMELINE_BATCH_SIZE)
    stale = true
  } else {
    try {
      console.log('fetchTimelineItemsFromNetwork')
      items = await fetchTimelineItemsFromNetwork(instanceName, accessToken, timelineName, lastTimelineItemId)
      /* no await */ storeFreshTimelineItemsInDatabase(instanceName, timelineName, items)
    } catch (e) {
      console.error(e)
      toast.say('Internet request failed. Showing offline content.')
      items = await database.getTimeline(instanceName, timelineName, lastTimelineItemId, TIMELINE_BATCH_SIZE)
      stale = true
    }
  }
  stop('fetchTimelineItems')
  return { items, stale }
}

async function addTimelineItems (instanceName, timelineName, items, stale) {
  console.log('addTimelineItems, length:', items.length)
  mark('addTimelineItemSummaries')
  const newSummaries = items.map(timelineItemToSummary)
  addTimelineItemSummaries(instanceName, timelineName, newSummaries, stale)
  stop('addTimelineItemSummaries')
}

export async function addTimelineItemSummaries (instanceName, timelineName, newSummaries, newStale) {
  const oldSummaries = store.getForTimeline(instanceName, timelineName, 'timelineItemSummaries') || []
  const oldStale = store.getForTimeline(instanceName, timelineName, 'timelineItemSummariesAreStale')

  const mergedSummaries = mergeArrays(oldSummaries, newSummaries, compareTimelineItemSummaries)

  if (!isEqual(oldSummaries, mergedSummaries)) {
    store.setForTimeline(instanceName, timelineName, { timelineItemSummaries: mergedSummaries })
  }
  if (oldStale !== newStale) {
    store.setForTimeline(instanceName, timelineName, { timelineItemSummariesAreStale: newStale })
  }
}

async function fetchTimelineItemsAndPossiblyFallBack () {
  console.log('fetchTimelineItemsAndPossiblyFallBack')
  mark('fetchTimelineItemsAndPossiblyFallBack')
  const {
    currentTimeline,
    currentInstance,
    accessToken,
    lastTimelineItemId,
    online
  } = store.get()

  const { items, stale } = await fetchTimelineItems(currentInstance, accessToken, currentTimeline, lastTimelineItemId, online)
  addTimelineItems(currentInstance, currentTimeline, items, stale)
  stop('fetchTimelineItemsAndPossiblyFallBack')
}

export async function setupTimeline () {
  console.log('setupTimeline')
  mark('setupTimeline')
  // If we don't have any item summaries, or if the current item summaries are stale
  // (i.e. via offline mode), then we need to re-fetch
  // Also do this if it's a thread, because threads change pretty frequently and
  // we don't have a good way to update them.
  const {
    timelineItemSummaries,
    timelineItemSummariesAreStale,
    currentTimeline
  } = store.get()
  console.log({ timelineItemSummaries, timelineItemSummariesAreStale, currentTimeline })
  if (!timelineItemSummaries ||
      timelineItemSummariesAreStale ||
      currentTimeline.startsWith('status/')) {
    await fetchTimelineItemsAndPossiblyFallBack()
  }
  stop('setupTimeline')
}

export async function fetchMoreItemsAtBottomOfTimeline (instanceName, timelineName) {
  console.log('setting runningUpdate: true')
  store.setForTimeline(instanceName, timelineName, { runningUpdate: true })
  await fetchTimelineItemsAndPossiblyFallBack()
  console.log('setting runningUpdate: false')
  store.setForTimeline(instanceName, timelineName, { runningUpdate: false })
}

export async function showMoreItemsForTimeline (instanceName, timelineName) {
  mark('showMoreItemsForTimeline')
  let itemSummariesToAdd = store.getForTimeline(instanceName, timelineName, 'timelineItemSummariesToAdd') || []
  itemSummariesToAdd = itemSummariesToAdd.sort(compareTimelineItemSummaries).reverse()
  addTimelineItemSummaries(instanceName, timelineName, itemSummariesToAdd, false)
  store.setForTimeline(instanceName, timelineName, {
    timelineItemSummariesToAdd: [],
    shouldShowHeader: false,
    showHeader: false
  })
  stop('showMoreItemsForTimeline')
}

export function showMoreItemsForCurrentTimeline () {
  const { currentInstance, currentTimeline } = store.get()
  return showMoreItemsForTimeline(
    currentInstance,
    currentTimeline
  )
}

export async function showMoreItemsForThread (instanceName, timelineName) {
  mark('showMoreItemsForThread')
  const itemSummariesToAdd = store.getForTimeline(instanceName, timelineName, 'timelineItemSummariesToAdd')
  const timelineItemSummaries = store.getForTimeline(instanceName, timelineName, 'timelineItemSummaries')
  const timelineItemIds = new Set(timelineItemSummaries.map(_ => _.id))
  // TODO: update database and do the thread merge correctly
  for (const itemSummaryToAdd of itemSummariesToAdd) {
    if (!timelineItemIds.has(itemSummaryToAdd.id)) {
      timelineItemSummaries.push(itemSummaryToAdd)
    }
  }
  store.setForTimeline(instanceName, timelineName, {
    timelineItemSummariesToAdd: [],
    timelineItemSummaries: timelineItemSummaries
  })
  stop('showMoreItemsForThread')
}
