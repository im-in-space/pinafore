import TextConfirmationDialog from '../components/TextConfirmationDialog.html'
import { showDialog } from './showDialog'

export default function showTextConfirmationDialog (options) {
  return showDialog(TextConfirmationDialog, Object.assign({
    label: 'Confirmation dialog'
  }, options))
}
