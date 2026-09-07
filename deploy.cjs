// DOTENV_CONFIG_PATH lets deploy-company.mjs point this at .env.<id>.
require('dotenv').config({ path: process.env.DOTENV_CONFIG_PATH || undefined })
const FtpDeploy = require('ftp-deploy')
const { spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const localRoot = path.join(__dirname, '.output/public')

// Some hosting accounts offer SFTP, others only plain FTP, so the transport is
// per company. With SFTP the key does the authenticating and no password
// crosses the network; plain FTP sends it in the clear on every upload.
//
// FTP_RSYNC is the third option and the one to prefer where SSH works. It uses
// the same key, but syncs the whole tree over a single connection. ftp-deploy's
// SFTP path opens a round trip per file; on Combell that measured 25s for one
// 88-byte file and stalled outright on a full build, where rsync finishes the
// same 86 files in under two seconds. It also prunes what earlier builds left
// behind, which neither of the other two transports do.
const useRsync = /^(1|true|yes)$/i.test(process.env.FTP_RSYNC || '')
const useSftp = /^(1|true|yes)$/i.test(process.env.FTP_SFTP || '')
const usesKey = useRsync || useSftp
const keyFile = process.env.FTP_PRIVATE_KEY || path.join(os.homedir(), '.ssh/id_ed25519')

const config = {
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  host: process.env.FTP_HOST,
  port: Number(process.env.FTP_PORT) || (usesKey ? 22 : 21),
  sftp: useSftp,
  localRoot,
  remoteRoot: process.env.FTP_REMOTE_ROOT || '/subsites/library.het-labo.be/generator/',
  include: ['*', '**/*', '**/.*'],
  deleteRemote: false,
  forcePasv: true
}

/** Stops with a message rather than uploading nothing and reporting success. */
const fail = (message, detail) => {
  console.error(`\n✗ Deploy afgebroken: ${message}`)
  if (detail) console.error(detail)
  process.exit(1)
}

for (const key of usesKey ? ['FTP_HOST', 'FTP_USER'] : ['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD']) {
  if (!process.env[key]) fail(`${key} ontbreekt. Vul .env aan.`)
}

if (usesKey) {
  if (!fs.existsSync(keyFile)) {
    fail(`Private sleutel niet gevonden: ${keyFile}`, 'Zet FTP_PRIVATE_KEY in .env als hij ergens anders staat.')
  }
  delete config.password
  if (useSftp) config.privateKey = fs.readFileSync(keyFile)
}

if (!fs.existsSync(path.join(localRoot, 'index.html'))) {
  fail('Er is niets gebouwd.', 'Draai eerst `npm run generate` (of gebruik `npm run shipit`).')
}

// Asset paths are baked into a build: the shared one expects /generator/, a
// per-company install whatever NUXT_BASE_PATH was set to. Upload a build where
// it does not belong and the page loads nothing — noticed only when someone
// opens it. So read the base out of the build and check the target agrees.
const indexHtml = fs.readFileSync(path.join(localRoot, 'index.html'), 'utf8')
const match = indexHtml.match(/(?:src|href)="([^"]*?)_nuxt\//)
const buildBase = match ? match[1] : null

if (!buildBase) {
  fail('Kon in de build niet terugvinden vanaf welk pad hij geserveerd wordt.')
}

const remote = config.remoteRoot.endsWith('/') ? config.remoteRoot : `${config.remoteRoot}/`

if (buildBase !== '/' && !remote.endsWith(buildBase)) {
  fail(
    'De build en de doelmap horen niet bij elkaar.',
    `De build verwacht ${buildBase}, maar de doelmap is ${remote}.\n` +
      'Bouw opnieuw met het juiste NUXT_BASE_PATH, of corrigeer FTP_REMOTE_ROOT.'
  )
}

if (buildBase === '/' && remote.replace(/\/$/, '').split('/').filter(Boolean).length > 1) {
  console.warn(
    `\n! Let op: deze build verwacht de root van een domein, maar wordt in ${remote} gezet.\n` +
      '  Klopt dat niet, zet NUXT_BASE_PATH en bouw opnieuw.'
  )
}

const transport = useRsync ? 'rsync over SSH' : useSftp ? 'SFTP' : 'FTP'
console.log(`Deployen naar ${config.host}${remote} via ${transport}`)

if (useRsync) {
  // --delete is what keeps old build hashes from piling up, but it also means a
  // wrong FTP_REMOTE_ROOT would empty a live website. So refuse to run unless
  // the target is a subdirectory below the document root.
  const segments = remote.replace(/\/$/, '').split('/').filter(Boolean)
  const docRoot = segments.indexOf('www')
  const insideSubdir = docRoot === -1 ? segments.length > 1 : segments.length > docRoot + 1

  if (!insideSubdir) {
    fail(
      'FTP_REMOTE_ROOT wijst naar de root van de site.',
      `Omdat rsync met --delete draait zou dat de hele website leegmaken.\n` +
        `Zet de submap erbij, bijvoorbeeld ${remote}tools/e-mail-handtekening/.`
    )
  }

  const ssh = `ssh -p ${config.port} -o BatchMode=yes -o StrictHostKeyChecking=accept-new -i ${keyFile}`
  const rsync = spawnSync(
    'rsync',
    ['-az', '--delete', '-e', ssh, `${localRoot}/`, `${config.user}@${config.host}:${remote}`],
    { stdio: 'inherit' }
  )

  if (rsync.error) fail('rsync kon niet starten.', String(rsync.error.message))
  if (rsync.status !== 0) {
    fail(
      `rsync stopte met code ${rsync.status}.`,
      'Bij code 255 ligt het aan SSH: klopt de host, en is je sleutel toegevoegd in het hostingpaneel?'
    )
  }

  console.log(`\n✓ Klaar. De map staat gelijk aan ${localRoot}.`)
  return
}

new FtpDeploy()
  .deploy(config)
  .then((res) => console.log(`\n✓ Klaar. ${res.length} bestanden geüpload.`))
  .catch((err) => {
    // Without this the process exits 0 and `npm run shipit` reports success
    // while nothing was uploaded.
    const hint =
      err && (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT')
        ? `\nGeen verbinding op poort ${config.port}. Bij SFTP: klopt de host, en is je IP vrijgegeven in het ` +
          'hostingpaneel? Combell filtert SSH standaard af.'
        : err && /login|530|authentication/i.test(String(err.message || err))
          ? '\nDe inloggegevens worden geweigerd. Controleer FTP_USER en FTP_PASSWORD in .env.'
          : ''

    fail('de upload is mislukt.', String(err && err.message ? err.message : err) + hint)
  })
