import { promisify } from 'util'
import childProcessPromise from 'child-process-promise'
import path from 'path'
import fs from 'fs'
import { envFile, RUBY_VERSION } from './mastodon-config'

const exec = childProcessPromise.exec
const stat = promisify(fs.stat)
const writeFile = promisify(fs.writeFile)
const dir = __dirname

const GIT_URL = 'https://github.com/tootsuite/mastodon.git'
const GIT_TAG = 'v3.3.0'

const mastodonDir = path.join(dir, '../mastodon')

export default async function cloneMastodon () {
  try {
    await stat(mastodonDir)
  } catch (e) {
    console.log('Cloning mastodon...')
    await exec(`git clone --single-branch --branch ${GIT_TAG} ${GIT_URL} "${mastodonDir}"`)
    await writeFile(path.join(dir, '../mastodon/.env'), envFile, 'utf8')
    await writeFile(path.join(dir, '../mastodon/.ruby-version'), RUBY_VERSION, 'utf8')
  }
}

if (require.main === module) {
  cloneMastodon().catch(err => {
    console.error(err)
    process.exit(1)
  })
}
