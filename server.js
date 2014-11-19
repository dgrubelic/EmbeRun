var express 	= require('express'),
	serveStatis = require('serve-static');

	app = express();

app.engine('html', require('ejs').renderFile);
app.set('views', process.cwd() + '/application/views');
app.use(serveStatis('./public/'));

app.get('*', function (req, res) {
	res.render('../index.html');
});

app.listen(process.env.PORT || 3000);