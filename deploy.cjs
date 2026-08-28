require('dotenv').config()
const FtpDeploy = require('ftp-deploy')
const path = require('path')

const ftpDeploy = new FtpDeploy()

const config = {
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  host: process.env.FTP_HOST,
  port: 21,
  // Nuxt static output folder
  localRoot: path.join(__dirname, '.output/public'),
  // Change this to your real server path
  remoteRoot: process.env.FTP_REMOTE_ROOT || '/subsites/library.het-labo.be/generator/',
  include: ['*', '**/*', '**/.*'],
  deleteRemote: false,
  forcePasv: true,
}

console.log('Starting deployment to:', config.host)

ftpDeploy
  .deploy(config)
  .then((res) => console.log('Finished! Uploaded', res.length, 'files.'))
  .catch((err) => console.log('Error:', err))