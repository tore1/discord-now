const http = require('http')

module.exports = (port, onRequest, onStart) => {
  http.createServer((req, res) => {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain')
    res.end(onRequest(req))
  }).listen(port, onStart)
}
