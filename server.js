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

app.post('/api/compress-image', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded')

    let quality = parseInt(req.body.quality) || 80
    let format = req.body.format || 'webp'

    if (format.startsWith('image/')) format = format.replace('image/', '')

    let img = sharp(req.file.buffer)

    if (req.body.stripExif !== 'false') img = img.withMetadata()

    let output

    if (format === 'jpeg' || format === 'jpg') {
      output = await img.jpeg({ quality }).toBuffer()
      format = 'jpeg'
    } else if (format === 'png') {
      output = await img.png({ quality }).toBuffer()
      format = 'png'
    } else {
      output = await img.webp({ quality }).toBuffer()
      format = 'webp'
    }

    res.set('Content-Type', `image/${format}`)
    res.set('Content-Disposition', `attachment; filename="compressed.${format}"`)
    res.send(output)

  } catch (err) {
    console.error(err)
    res.status(500).send('Image compression failed')
  }
})

app.post('/api/compress-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded')

    const pdfDoc = await PDFDocument.load(req.file.buffer)

    if (req.body.stripMetadata === 'true') {
      pdfDoc.setTitle('')
      pdfDoc.setAuthor('')
      pdfDoc.setSubject('')
      pdfDoc.setKeywords([])
      pdfDoc.setProducer('')
      pdfDoc.setCreator('')
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true })

    res.set('Content-Type', 'application/pdf')
    res.set('Content-Disposition', 'attachment; filename="compressed.pdf"')
    res.send(Buffer.from(pdfBytes))

  } catch (err) {
    console.error(err)
    res.status(500).send('PDF compression failed')
  }
})

app.post('/api/compress-video', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded')

  const inputPath = path.join(os.tmpdir(), `in-${crypto.randomBytes(4).toString('hex')}.mp4`)
  const outputFormat = req.body.format || 'mp4'
  const outputPath = path.join(os.tmpdir(), `out-${crypto.randomBytes(4).toString('hex')}.${outputFormat}`)

  try {
    fs.writeFileSync(inputPath, req.file.buffer)
  } catch (err) {
    console.error(err)
    return res.status(500).send('File write failed')
  }

  let command = ffmpeg(inputPath)

  if (req.body.resolution && req.body.resolution !== 'original') {
    command = command.size(`?x${req.body.resolution.replace('p', '')}`)
  }

  if (outputFormat === 'webm') {
    command = command.format('webm').videoCodec('libvpx-vp9').audioCodec('libopus')
  } else {
    command = command.format('mp4').videoCodec('libx264').audioCodec('aac')
  }

  if (req.body.removeAudio === 'true') {
    command = command.noAudio()
  }

  command
    .on('start', cmd => console.log('FFmpeg:', cmd))
    .on('end', () => {
      res.download(outputPath, `compressed.${outputFormat}`, () => {
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
      })
    })
    .on('error', err => {
      console.error('FFmpeg error:', err)
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath)
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath)
      if (!res.headersSent) res.status(500).send('Video compression failed')
    })
    .save(outputPath)
})

app.listen(port, (err) => {
  if (err) {
    console.error('Failed to start server:', err.message)
    process.exit(1)
  }
  console.log(`Server running at http://localhost:${port}`)
})