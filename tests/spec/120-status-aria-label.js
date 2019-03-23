import { loginAsFoobar } from '../roles'
import { getNthStatus } from '../utils'
import { postAs, postEmptyStatusWithMediaAs } from '../serverActions'

fixture`120-status-aria-label.js`
  .page`http://localhost:4002`

test('aria-labels for statuses with no content text', async t => {
  await postEmptyStatusWithMediaAs('foobar', 'kitten1.jpg', 'kitteh')
  await loginAsFoobar(t)
  await t
    .hover(getNthStatus(1))
    .expect(getNthStatus(1).getAttribute('aria-label')).match(
      /foobar, (.+ ago|just now), @foobar, Public/i
    )
})

test('aria-labels with links', async t => {
  let content = 'Text here\n\nMore text\n\n' +
    'https://example.com/long/url/here/very/long/yes/so/long\n\n' +
    '#woot #yolo'

  let expected = 'admin, Text here More text ' +
    'https://example.com/long/url/here/very/long/yes/so/long #woot #yolo,'

  await postAs('admin', content)

  await loginAsFoobar(t)
  await t
    .hover(getNthStatus(1))
    .expect(getNthStatus(1).getAttribute('aria-label')).contains(expected)
})
