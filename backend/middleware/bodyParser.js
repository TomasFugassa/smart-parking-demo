export default function bodyParser(req, res, next) {
  let data = '';
  req.on('data', chunk => data += chunk);
  req.on('end', () => {
    try { req.body = JSON.parse(data); } catch { req.body = {}; }
    next();
  });
}
