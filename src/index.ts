import * as fs from 'fs'
import * as ini from 'ini'

export function writeNpmrc(rcFile: string, noConsole = false) {
  const projectNamespace = process.env.CI_PROJECT_ROOT_NAMESPACE
  const serverProto = process.env.CI_SERVER_PROTOCOL
  const serverHost = process.env.CI_SERVER_HOST
  const serverPort = process.env.CI_SERVER_PORT
  const projectId = process.env.CI_PROJECT_ID
  const jobToken = process.env.CI_JOB_TOKEN
  if (!projectNamespace || !serverHost || !serverProto || !projectId || !jobToken) {
    if (!noConsole) {
      console.log(`Missing CI environment variables:`, {
        CI_PROJECT_ROOT_NAMESPACE: projectNamespace,
        CI_SERVER_PROTOCOL: serverProto,
        CI_SERVER_HOST: serverHost,
        CI_SERVER_PORT: serverPort,
        CI_PROJECT_ID: projectId,
        CI_JOB_TOKEN: '***',
      })
    }
    return false
  }

  let config: Record<string, string>
  if (!fs.existsSync(rcFile)) {
    config = {}
  } else {
    try {
      config = ini.parse(fs.readFileSync(rcFile, 'utf8'))
    } catch (err) {
      if (!noConsole) {
        console.error(`read ${rcFile} failed:`, err)
      }
      return false
    }
  }

  const registryKey = `@${projectNamespace}:registry`
  let hostAndPath
  if (serverPort === '443' || serverPort === '80') {
    hostAndPath = `//${serverHost}/api/v4/packages/npm/`
  } else {
    hostAndPath = `//${serverHost}:${serverPort}/api/v4/packages/npm/`
  }

  let hostAndPathWithProjectId
  if (serverPort === '443' || serverPort === '80') {
    hostAndPathWithProjectId = `//${serverHost}/api/v4/projects/${projectId}/packages/npm/`
  } else {
    hostAndPathWithProjectId = `//${serverHost}:${serverPort}/api/v4/projects/${projectId}/packages/npm/`
  }

  if (!config[registryKey]) {
    config[registryKey] = hostAndPath
  }

  if (!config[hostAndPath + ':_authToken']) {
    config[hostAndPath + ':_authToken'] = jobToken
  }

  if (!config[hostAndPathWithProjectId + ':_authToken']) {
    config[hostAndPathWithProjectId + ':_authToken'] = jobToken
  }

  fs.writeFileSync(rcFile, ini.stringify(config))

  return true
}
