
module.exports = k => {
  const v = process.env[k]
  // JSON in base64
  try {
    return JSON.parse(Buffer.from(v, 'base64').toString())
  } catch (_) {
    // JSON
    try {
      return JSON.parse(v)
    } catch (_) {
      // String in base64
      try {
        return Buffer.from(v, 'base64').toString().trim()
      } catch (_) {
        // String
        return v && v.trim()
      }
    }
  }
}
