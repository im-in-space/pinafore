import { store } from '../_store/store'
import { setShowReblogs as setShowReblogsApi } from '../_api/showReblogs'
import { toast } from '../_components/toast/toast'
import { updateLocalRelationship } from './accounts'
import { formatIntl } from '../_utils/formatIntl'

export async function setShowReblogs (accountId, showReblogs, toastOnSuccess) {
  const { currentInstance, accessToken } = store.get()
  try {
    const relationship = await setShowReblogsApi(currentInstance, accessToken, accountId, showReblogs)
    await updateLocalRelationship(currentInstance, accountId, relationship)
    if (toastOnSuccess) {
      /* no await */ toast.say(showReblogs ? 'intl.showingReblogs' : 'intl.hidingReblogs')
    }
  } catch (e) {
    console.error(e)
    /* no await */ toast.say(showReblogs
      ? formatIntl('intl.unableToShowReblogs', { error: (e.message || '') })
      : formatIntl('intl.unableToHideReblogs', { error: (e.message || '') })
    )
  }
}
