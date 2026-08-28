require('dotenv').config()
const FtpDeploy = require('ftp-deploy')
const fs = require('fs')
const path = require('path')

const localRoot = path.join(__dirname, '.output/public')

const config = {
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  host: process.env.FTP_HOST,
  port: Number(process.env.FTP_PORT) || 21,
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

for (const key of ['FTP_HOST', 'FTP_USER', 'FTP_PASSWORD']) {
  if (!process.env[key]) fail(`${key} ontbreekt. Vul .env aan.`)
}

if (!fs.existsSync(path.join(localRoot, 'index.html'))) {
  fail('Er is niets gebouwd.', 'Draai eerst `npm run generate` (of gebruik `npm run shipit`).')
}

// The shared build is served from /generator/; a standalone build (NUXT_COMPANY)
// is rooted at /. Uploading the wrong one to the shared folder breaks the site
// in a way that is easy to miss, so check before touching the server.
const indexHtml = fs.readFileSync(path.join(localRoot, 'index.html'), 'utf8')
const expectedBase = config.remoteRoot.includes('/generator') ? '/generator/' : null

if (expectedBase && !indexHtml.includes(`"${expectedBase}_nuxt/`)) {
  fail(
    'De build in .output past niet bij de doelmap.',
    `Verwacht een build met baseURL ${expectedBase} — dit lijkt een standalone build.\n` +
      'Draai `npm run generate` opnieuw zonder NUXT_COMPANY.'
  )
}

console.log(`Deployen naar ${config.host}${config.remoteRoot}`)

new FtpDeploy()
  .deploy(config)
  .then((res) => console.log(`\n✓ Klaar. ${res.length} bestanden geüpload.`))
  .catch((err) => {
    // Without this the process exits 0 and `npm run shipit` reports success
    // while nothing was uploaded.
    const hint =
      err && err.code === 'ECONNREFUSED'
        ? '\nDe server weigert de verbinding op poort ' +
          config.port +
          '. Staat plain FTP nog aan bij de host, of is het intussen FTPS/SFTP geworden?'
        : err && /login|530|authentication/i.test(String(err.message || err))
          ? '\nDe inloggegevens worden geweigerd. Controleer FTP_USER en FTP_PASSWORD in .env.'
          : ''

    fail('de upload is mislukt.', String(err && err.message ? err.message : err) + hint)
  })
