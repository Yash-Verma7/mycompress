const express = require('express')
const cors = require('cors')
const multer = require('multer')
const sharp = require('sharp')
const { PDFDocument } = require('pdf-lib')
const path = require('path')
const fs = require('fs')
const os = require('os')
const crypto = require('crypto')
const ffmpeg = require('fluent-ffmpeg')

const app = express()
const port = 3000

app.use(cors())
app.use(express.static(__dirname))

process.on('uncaughtException', err => console.error('UNCAUGHT:', err))
process.on('unhandledRejection', err => console.error('UNHANDLED:', err))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})