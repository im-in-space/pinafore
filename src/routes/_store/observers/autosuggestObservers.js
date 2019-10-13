import { store } from '../store'
import { doEmojiSearch } from '../../_actions/autosuggestEmojiSearch'
import { doAccountSearch } from '../../_actions/autosuggestAccountSearch'
import { doHashtagSearch } from '../../_actions/autosuggestHashtagSearch'

function resetAutosuggest () {
  store.setForCurrentAutosuggest({
    autosuggestSelected: 0,
    autosuggestSearchResults: []
  })
}

export function autosuggestObservers () {
  let lastSearch

  store.observe('autosuggestSearchText', async autosuggestSearchText => {
    // cancel any inflight XHRs or other operations
    if (lastSearch) {
      lastSearch.cancel()
      lastSearch = null
    }
    // autosuggestSelecting indicates that the user has pressed Enter or clicked on an item
    // and the results are being processed. Returning early avoids a flash of searched content.
    const { composeFocused } = store.get()
    const autosuggestSelecting = store.getForCurrentAutosuggest('autosuggestSelecting')
    if (!composeFocused || !autosuggestSearchText || autosuggestSelecting) {
      return
    }

    resetAutosuggest()
    if (autosuggestSearchText.startsWith(':')) { // emoji
      lastSearch = doEmojiSearch(autosuggestSearchText)
    } else if (autosuggestSearchText.startsWith('#')) { // hashtag
      lastSearch = doHashtagSearch(autosuggestSearchText)
    } else { // account
      lastSearch = doAccountSearch(autosuggestSearchText)
    }
  })
}
