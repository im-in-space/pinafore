import MediaFocalPointDialog from '../components/MediaEditDialog.html'
import { showDialog } from './showDialog'

export default function showMediaEditDialog (realm, index, type) {
  return showDialog(MediaFocalPointDialog, {
    label: 'Edit media',
    title: 'Edit media',
    realm,
    index,
    type
  })
}
