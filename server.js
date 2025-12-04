const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()

const port = 3045;

app.use(express.static('public'))

// respond with "hello world" when a GET request is made to the homepage
app.get('/', (req, res) => {
  res.send('hello world')
})


app.use(express.json())



app.post('/finance/save', async (req, res) => {
  try {
    const payload = req.body || {}
    const { startDate, endDate } = payload
    console.log(payload);
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' })
    }

    const toYYYYMMDD = (val) => {
      const d = new Date(val)
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}${m}${day}`
      }
      const digits = String(val).replace(/\D/g, '')
      if (digits.length === 8) return digits
      throw new Error('Invalid date format')
    }

    const title = `${toYYYYMMDD(startDate)}-${toYYYYMMDD(endDate)}`
    const dir = path.join(__dirname, 'data', 'finance')
    await fs.promises.mkdir(dir, { recursive: true })
    const filePath = path.join(dir, `${title}.json`)
    await fs.promises.writeFile(filePath, JSON.stringify(payload, null, 2), 'utf8')

    res.status(201).json({ saved: true, title })
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to save' })
  }
})


// List all finance JSON files with summary fields
app.get('/finance/list', async (req, res) => {
  try {
    const dir = path.join(__dirname, 'data', 'finance')
    await fs.promises.mkdir(dir, { recursive: true })
    const files = await fs.promises.readdir(dir)
    const jsonFiles = files.filter(f => f.toLowerCase().endsWith('.json'))

    const results = await Promise.all(
      jsonFiles.map(async (filename) => {
        const filePath = path.join(dir, filename)
        try {
          const content = await fs.promises.readFile(filePath, 'utf8')
          const data = JSON.parse(content)
          return {
            filename,
            // Note: the user requested key `estimmatedSavings` (intentional typo)
            estimmatedSavings: data.estimatedSavings,
            totalIncome: data.totalIncome,
            totalFixedCost: data.totalFixedCost,
            totalVariableCost: data.totalVariableCost,
          }
        } catch (e) {
          return {
            filename,
            estimmatedSavings: null,
            totalIncome: null,
            totalFixedCost: null,
            totalVariableCost: null,
          }
        }
      })
    )

    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to list finance files' })
  }
})

// Return the current-month finance file (latest existing by endDate)
app.get('/finance/current-month', async (req, res) => {
  try {
    const dir = path.join(__dirname, 'data', 'finance')
    await fs.promises.mkdir(dir, { recursive: true })
    const files = await fs.promises.readdir(dir)
    const jsonFiles = files.filter(f => f.toLowerCase().endsWith('.json'))
    if (jsonFiles.length === 0) {
      return res.status(404).json({ error: 'No finance files found' })
    }

    const parseEndDateFrom = (filename, data) => {
      const m = filename.match(/(\d{8})-(\d{8})\.json$/)
      if (m) {
        const end = m[2]
        const y = end.slice(0, 4)
        const mo = end.slice(4, 6)
        const d = end.slice(6, 8)
        const dt = new Date(`${y}-${mo}-${d}T00:00:00Z`)
        if (!isNaN(dt.getTime())) return dt
      }
      if (data && data.endDate) {
        const dt = new Date(data.endDate)
        if (!isNaN(dt.getTime())) return dt
      }
      return null
    }

    const fileInfos = []
    for (const filename of jsonFiles) {
      try {
        const p = path.join(dir, filename)
        const txt = await fs.promises.readFile(p, 'utf8')
        const data = JSON.parse(txt)
        const endDate = parseEndDateFrom(filename, data)
        fileInfos.push({ filename, endDate, data })
      } catch (_) {
        // skip malformed file
      }
    }

    if (fileInfos.length === 0) {
      return res.status(404).json({ error: 'No valid finance data found' })
    }

    // Return the last file in the ordered list
    const withDates = fileInfos.filter(fi => fi.endDate)
    let chosen
    if (withDates.length > 0) {
      withDates.sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
      chosen = withDates[withDates.length - 1]
    } else {
      fileInfos.sort((a, b) => a.filename.localeCompare(b.filename, undefined, { numeric: true, sensitivity: 'base' }))
      chosen = fileInfos[fileInfos.length - 1]
    }

    return res.json({ filename: chosen.filename, data: chosen.data })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get current month data' })
  }
})


// Delete a specific finance file by filename
app.delete('/finance/:filename', async (req, res) => {
  try {
    const raw = req.params.filename || ''
    if (!/^[\w.-]+\.json$/i.test(raw)) {
      return res.status(400).json({ error: 'Invalid filename' })
    }

    const dir = path.join(__dirname, 'data', 'finance')
    await fs.promises.mkdir(dir, { recursive: true })
    const filePath = path.join(dir, raw)

    const resolvedDir = path.resolve(dir)
    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(resolvedDir + path.sep)) {
      return res.status(400).json({ error: 'Invalid path' })
    }

    await fs.promises.unlink(filePath)
    res.json({ deleted: true, filename: raw })
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' })
    }
    res.status(500).json({ error: err.message || 'Failed to delete file' })
  }
})
// Get a specific finance file by filename
app.get('/finance/:filename', async (req, res) => {
  try {
    const raw = req.params.filename || ''
    if (!/^[\w.-]+\.json$/i.test(raw)) {
      return res.status(400).json({ error: 'Invalid filename' })
    }

    const dir = path.join(__dirname, 'data', 'finance')
    await fs.promises.mkdir(dir, { recursive: true })
    const filePath = path.join(dir, raw)

    // Prevent path traversal
    const resolvedDir = path.resolve(dir)
    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(resolvedDir + path.sep)) {
      return res.status(400).json({ error: 'Invalid path' })
    }

    const content = await fs.promises.readFile(filePath, 'utf8')
    const data = JSON.parse(content)
    res.json({ filename: raw, data })
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' })
    }
    if (err instanceof SyntaxError) {
      return res.status(400).json({ error: 'Malformed JSON in file' })
    }
    res.status(500).json({ error: err.message || 'Failed to read file' })
  }
})

// Alias route to support `/current-month` as requested
app.get('finance/current-month', async (req, res) => {
  // Delegate to the finance route handler by calling next middleware
  // Simpler: replicate the selection logic
  try {
    const dir = path.join(__dirname, 'data', 'finance')
    await fs.promises.mkdir(dir, { recursive: true })
    const files = await fs.promises.readdir(dir)
    const jsonFiles = files.filter(f => f.toLowerCase().endsWith('.json'))
    if (jsonFiles.length === 0) {
      return res.status(404).json({ error: 'No finance files found' })
    }

    const parseEndDateFrom = (filename, data) => {
      const m = filename.match(/(\d{8})-(\d{8})\.json$/)
      if (m) {
        const end = m[2]
        const y = end.slice(0, 4)
        const mo = end.slice(4, 6)
        const d = end.slice(6, 8)
        const dt = new Date(`${y}-${mo}-${d}T00:00:00Z`)
        if (!isNaN(dt.getTime())) return dt
      }
      if (data && data.endDate) {
        const dt = new Date(data.endDate)
        if (!isNaN(dt.getTime())) return dt
      }
      return null
    }

    const now = new Date()
    const fileInfos = []
    for (const filename of jsonFiles) {
      try {
        const p = path.join(dir, filename)
        const txt = await fs.promises.readFile(p, 'utf8')
        const data = JSON.parse(txt)
        const endDate = parseEndDateFrom(filename, data)
        fileInfos.push({ filename, endDate, data })
      } catch (_) {}
    }

    if (fileInfos.length === 0) {
      return res.status(404).json({ error: 'No valid finance data found' })
    }

    const pastOrNow = fileInfos.filter(fi => fi.endDate && fi.endDate.getTime() <= now.getTime())
    const pool = pastOrNow.length > 0 ? pastOrNow : fileInfos.filter(fi => fi.endDate)
    pool.sort((a, b) => a.endDate.getTime() - b.endDate.getTime())
    const chosen = pool[pool.length - 1] || fileInfos[0]

    return res.json({ filename: chosen.filename, data: chosen.data })
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to get current month data' })
  }
})


app.listen(port, () => {
  console.log(`app listening on port ${port}`)
})