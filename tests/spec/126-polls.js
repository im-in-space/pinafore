import {
  getNthStatusContent,
  getNthStatusPollOption,
  getNthStatusPollVoteButton,
  getNthStatusPollForm,
  getNthStatusPollResult,
  sleep,
  getNthStatusPollRefreshButton,
  getNthStatusPollVoteCount,
  getNthStatusRelativeDate, getUrl, goBack
} from '../utils'
import { loginAsFoobar } from '../roles'
import { createPollAs, voteOnPollAs } from '../serverActions'

fixture`126-polls.js`
  .page`http://localhost:4002`

test('Can vote on polls', async t => {
  await createPollAs('admin', 'vote on my cool poll', ['yes', 'no'], false)
  await sleep(2000)
  await loginAsFoobar(t)
  await t
    .expect(getNthStatusContent(1).innerText).contains('vote on my cool poll')
    .expect(getNthStatusPollVoteCount(1).innerText).eql('0 votes')
  await sleep(1000)
  await t
    .click(getNthStatusPollOption(1, 2))
  await sleep(1000)
  await t
    .click(getNthStatusPollVoteButton(1))
    .expect(getNthStatusPollForm(1).exists).notOk({ timeout: 20000 })
    .expect(getNthStatusPollResult(1, 1).innerText).eql('0% yes')
    .expect(getNthStatusPollResult(1, 2).innerText).eql('100% no')
    .expect(getNthStatusPollVoteCount(1).innerText).eql('1 vote')
})

test('Can vote on multiple-choice polls', async t => {
  await createPollAs('admin', 'vote on my other poll', ['yes', 'no', 'maybe'], true)
  await sleep(2000)
  await loginAsFoobar(t)
  await t
    .expect(getNthStatusContent(1).innerText).contains('vote on my other poll')
  await sleep(1000)
  await t
    .click(getNthStatusPollOption(1, 1))
  await sleep(1000)
  await t
    .click(getNthStatusPollOption(1, 3))
  await sleep(1000)
  await t
    .click(getNthStatusPollVoteButton(1))
    .expect(getNthStatusPollForm(1).exists).notOk({ timeout: 20000 })
    .expect(getNthStatusPollResult(1, 1).innerText).eql('50% yes')
    .expect(getNthStatusPollResult(1, 2).innerText).eql('0% no')
    .expect(getNthStatusPollResult(1, 3).innerText).eql('50% maybe')
    .expect(getNthStatusPollVoteCount(1).innerText).eql('2 votes')
})

test('Can update poll results', async t => {
  const { poll } = await createPollAs('admin', 'vote on this poll', ['yes', 'no', 'maybe'], false)
  const { id: pollId } = poll
  await voteOnPollAs('baz', pollId, [1])
  await voteOnPollAs('ExternalLinks', pollId, [1])
  await voteOnPollAs('foobar', pollId, [2])
  await sleep(1000)
  await loginAsFoobar(t)
  await t
    .expect(getNthStatusContent(1).innerText).contains('vote on this poll')
    .expect(getNthStatusPollForm(1).exists).notOk()
    .expect(getNthStatusPollResult(1, 1).innerText).eql('0% yes')
    .expect(getNthStatusPollResult(1, 2).innerText).eql('67% no')
    .expect(getNthStatusPollResult(1, 3).innerText).eql('33% maybe')
    .expect(getNthStatusPollVoteCount(1).innerText).eql('3 votes')
  await sleep(1000)
  await voteOnPollAs('quux', pollId, [0])
  await sleep(1000)
  await t
    .click(getNthStatusPollRefreshButton(1))
    .expect(getNthStatusPollResult(1, 1).innerText).eql('25% yes', { timeout: 20000 })
    .expect(getNthStatusPollResult(1, 2).innerText).eql('50% no')
    .expect(getNthStatusPollResult(1, 3).innerText).eql('25% maybe')
    .expect(getNthStatusPollVoteCount(1).innerText).eql('4 votes')
})

test('Poll results refresh everywhere', async t => {
  await createPollAs('admin', 'another poll', ['yes', 'no'], false)
  await sleep(2000)
  await loginAsFoobar(t)
  await t
    .expect(getNthStatusContent(1).innerText).contains('another poll')
    .click(getNthStatusRelativeDate(1))
    .expect(getUrl()).contains('/statuses')
    .expect(getNthStatusContent(1).innerText).contains('another poll')
    .click(getNthStatusPollOption(1, 1))
    .click(getNthStatusPollVoteButton(1))
    .expect(getNthStatusPollForm(1).exists).notOk({ timeout: 20000 })
    .expect(getNthStatusPollResult(1, 1).innerText).eql('100% yes')
    .expect(getNthStatusPollResult(1, 2).innerText).eql('0% no')
    .expect(getNthStatusPollVoteCount(1).innerText).eql('1 vote')
  await goBack()
  await t
    .expect(getUrl()).eql('http://localhost:4002/')
    .expect(getNthStatusPollForm(1).exists).notOk({ timeout: 20000 })
    .expect(getNthStatusPollResult(1, 1).innerText).eql('100% yes')
    .expect(getNthStatusPollResult(1, 2).innerText).eql('0% no')
    .expect(getNthStatusPollVoteCount(1).innerText).eql('1 vote')
})
