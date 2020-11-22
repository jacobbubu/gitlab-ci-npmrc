jest.mock(`fs`, () => {
  const fs = jest.requireActual('fs')
  // const unionfs = require('unionfs').default
  const { Union } = require('unionfs')
  const ufs = new Union()
  ufs.reset = () => {
    // fss is ufs' list of overlays
    ufs.fss = [fs]
  }

  // strange, the `use` method is lost on subsequent calls.
  // so we use a new method `use2` to call the closured `use`
  ufs.use2 = (newFs: any) => {
    ufs.use(newFs)
  }
  return ufs.use(fs)
})

import * as fs from 'fs'
import { Volume } from 'memfs'
import * as ini from 'ini'

import { writeNpmrc } from '../src'

const rc = {}
const rcFile = 'target/.npmrc'

describe('writeNpmrc test', () => {
  afterEach(() => {
    // Reset the mocked fs
    ;(fs as any).reset()
  })

  it('not changed when the env. are not ready', () => {
    const vol = Volume.fromJSON({
      [rcFile]: JSON.stringify({}, null, 2),
    })

    ;(fs as any).use2(vol)

    const original = fs.readFileSync(rcFile, 'utf8')
    expect(writeNpmrc(rcFile, true)).toBeFalsy()
    expect(original).toBe(fs.readFileSync(rcFile, 'utf8'))
  })

  it('create .npmrc', () => {
    process.env.CI_PROJECT_ROOT_NAMESPACE = 'li-mesh'
    process.env.CI_SERVER_HOST = 'gitlab.com'
    process.env.CI_SERVER_PROTOCOL = 'https'
    process.env.CI_SERVER_PORT = '443'
    process.env.CI_PROJECT_ID = '21'
    process.env.CI_JOB_TOKEN = '***'

    const vol = Volume.fromJSON({})
    vol.mkdirpSync('target')
    ;(fs as any).use2(vol)

    expect(writeNpmrc(rcFile, true)).toBeTruthy()
    const parsed = ini.parse(fs.readFileSync(rcFile, 'utf8'))
    const expectedHostAndPath = `//${process.env.CI_SERVER_HOST}/api/v4/packages/npm/`
    const expectedHostAndPathWithProjectId = `//${process.env.CI_SERVER_HOST}/api/v4/projects/${process.env.CI_PROJECT_ID}/packages/npm/`
    expect(parsed[`@${process.env.CI_PROJECT_ROOT_NAMESPACE}:registry`]).toBe(
      process.env.CI_SERVER_PROTOCOL + ':' + expectedHostAndPath
    )
    expect(parsed[expectedHostAndPath + ':_authToken']).toBe(process.env.CI_JOB_TOKEN)
    expect(parsed[expectedHostAndPathWithProjectId + ':_authToken']).toBe(process.env.CI_JOB_TOKEN)
  })

  it('create .npmrc with non-default server port', () => {
    process.env.CI_PROJECT_ROOT_NAMESPACE = 'li-mesh'
    process.env.CI_SERVER_HOST = 'gitlab.com'
    process.env.CI_SERVER_PROTOCOL = 'https'
    process.env.CI_SERVER_PORT = '8080'
    process.env.CI_PROJECT_ID = '21'
    process.env.CI_JOB_TOKEN = '***'

    const vol = Volume.fromJSON({})
    vol.mkdirpSync('target')
    ;(fs as any).use2(vol)

    expect(writeNpmrc(rcFile, true)).toBeTruthy()
    const parsed = ini.parse(fs.readFileSync(rcFile, 'utf8'))
    const expectedHostAndPath = `//${process.env.CI_SERVER_HOST}:${process.env.CI_SERVER_PORT}/api/v4/packages/npm/`
    const expectedHostAndPathWithProjectId = `//${process.env.CI_SERVER_HOST}:${process.env.CI_SERVER_PORT}/api/v4/projects/${process.env.CI_PROJECT_ID}/packages/npm/`
    expect(parsed[`@${process.env.CI_PROJECT_ROOT_NAMESPACE}:registry`]).toBe(
      process.env.CI_SERVER_PROTOCOL + ':' + expectedHostAndPath
    )
    expect(parsed[expectedHostAndPath + ':_authToken']).toBe(process.env.CI_JOB_TOKEN)
    expect(parsed[expectedHostAndPathWithProjectId + ':_authToken']).toBe(process.env.CI_JOB_TOKEN)
  })

  it('change .npmrc', () => {
    process.env.CI_PROJECT_ROOT_NAMESPACE = 'li-mesh'
    process.env.CI_SERVER_HOST = 'gitlab.com'
    process.env.CI_SERVER_PROTOCOL = 'https'
    process.env.CI_SERVER_PORT = '443'
    process.env.CI_PROJECT_ID = '21'
    process.env.CI_JOB_TOKEN = '***'

    const defaultConfig = {
      '@li-mesh:registry': 'DEFAULT_URL',
    }
    const vol = Volume.fromJSON({
      [rcFile]: ini.stringify(defaultConfig),
    })
    ;(fs as any).use2(vol)

    expect(writeNpmrc(rcFile, true)).toBeTruthy()
    const parsed = ini.parse(fs.readFileSync(rcFile, 'utf8'))
    const expectedHostAndPath = `//${process.env.CI_SERVER_HOST}/api/v4/packages/npm/`
    const expectedHostAndPathWithProjectId = `//${process.env.CI_SERVER_HOST}/api/v4/projects/${process.env.CI_PROJECT_ID}/packages/npm/`
    expect(parsed['@li-mesh:registry']).toBe(defaultConfig['@li-mesh:registry'])
    expect(parsed[expectedHostAndPath + ':_authToken']).toBe(process.env.CI_JOB_TOKEN)
    expect(parsed[expectedHostAndPathWithProjectId + ':_authToken']).toBe(process.env.CI_JOB_TOKEN)
  })
})
