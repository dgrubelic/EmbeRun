(function (global) {
	'use strict';

	var app = Ember.Application.create();

	app.Router.map(function () {
		this.route('session', { path: '/session', queryParams: ['page'] });
		this.route('session-details', { path: '/session/:session_id' });
	});

	// Routes
	app.IndexRoute = Ember.Route.extend({
		redirect: function() {
			this.transitionTo('session');
		}
	});

	// Required objects
	app.PaginationObject = Ember.Object.extend({
		page: 1,
		per_page: 15,
		total: 0,
		available_pages: 1,
		sort_by: 'start_time',
		order: 'desc'
	});

	app.PaginationLinksComponent = Ember.Component.extend({
		pagination: 	null,
		maxPages: 		10,
		pages: 			[],

		calculatePages: function () {
			var maxPages = this.get('maxPages'),
				availablePages = this.get('pagination.available_pages'),
				currentPage = parseInt(this.get('pagination.page'), 10);

			var getPage = function (page) {
				return {
					value: page,
					isCurrent: (currentPage === page)
				};
			}

			var pages = [];

			if (currentPage > (availablePages - (maxPages - 2))) {
				pages.push(getPage(1));
				pages.push(getPage(2));

				for (var i = (availablePages - (maxPages - 2)); i <= availablePages; i++) {
					pages.push(getPage(i));
				}
			} else if (currentPage < (maxPages - 2)) {
				for (var i = 1; i <= (maxPages - 2); i++) {
					pages.push(getPage(i));
				}

				pages.push(getPage(availablePages - 1));
				pages.push(getPage(availablePages));
			} else {
				pages.push(getPage(1));
				pages.push(getPage(2));

				for (var i = (currentPage - 2); i <= (currentPage + 2); i++) {
					pages.push(getPage(i));
				}

				pages.push(getPage(availablePages - 1));
				pages.push(getPage(availablePages));
			}

			this.set('pages', pages);
			this.set('currentPage', currentPage);
		}.observes('pagination').on('init'),

		actions: {
			changePage: function (page) {
				this.sendAction('action', page);
			},

			previousPage: function () {
				var currentPage = parseInt(this.get('pagination.page'), 10);

				var previousPage = currentPage - 1;
				if (previousPage > 0) {
					this.sendAction('action', previousPage);
				}
			},

			nextPage: function () {
				var currentPage = parseInt(this.get('pagination.page'), 10),
					availablePages = parseInt(this.get('pagination.available_pages'), 10);

				var nextPage = currentPage + 1;
				if (nextPage <= availablePages) {
					this.sendAction('action', nextPage);
				}
			}
		}
	});

	Ember.Handlebars.helper('formatDate', function(date, options) {  
		var format = 'DD.MM.YYYY HH:mm:ss';

		if (options.hash.format) {
			format = options.hash.format;
		}

		return new Ember.Handlebars.SafeString(moment(date).format(format));
	});

	Ember.Handlebars.helper('formatDuration', function (totalSeconds, options) {
		totalSeconds = parseInt(totalSeconds, 10);
		totalSeconds = totalSeconds / 1000;

		var seconds = 0,
			minutes = 0,
			hours 	= 0;

		function parseHours(hr) {
			if ((hr - 3600) >= 0) {
				hours += 1;
				return parseHours(hr - 3600);
			} else {
				return hr;
			}
		}

		var secondsLeft = parseHours(totalSeconds);

		secondsLeft = (function parseMinutes(min) {
			if ((min - 60) >= 0) {
				minutes += 1;
				return parseMinutes(min - 60);
			} else {
				return min;
			}
		}(secondsLeft));

		seconds = secondsLeft;
		
		var output = '';
		if (hours >= 1) {
			output += (hours + 'h ');
		}

		if (minutes >= 1) {
			output += (minutes + 'm ');
		}

		if (seconds >= 1) {
			output += (Math.ceil(seconds) + 's');
		}

		return new Ember.Handlebars.SafeString(output);
	});

	Ember.Handlebars.helper('formatDistance', function (distance, options) {
		distance = parseInt(distance, 10);

		var kilometers 	= 0,
			meters 		= 0;

		function parseKilometers(mtr) {
			if ((mtr - 1000) >= 0) {
				kilometers += 1;
				return parseKilometers(mtr - 1000);
			} else {
				return mtr;
			}
		}

		meters = parseKilometers(distance);

		var output = '';
		if (kilometers >= 1) {
			output += (kilometers + 'km ');
		}

		if (meters >= 1) {
			output += (meters + 'm ');
		}

		return output;

		return new Ember.Handlebars.SafeString(output);
	});

	app.RunSession = DS.Model.extend({
		start_time: DS.attr('date'),
		end_time: DS.attr('date'),
		duration: DS.attr('number'),
		distance: DS.attr('number'),
		sport_type_id: DS.attr('number'),
		encoded_trace: DS.attr()
	});

	app.RunSessionAdapter = DS.RESTAdapter.extend({
		host: 'https://intense-bastion-3210.herokuapp.com',

		pathForType: function(type) {
			var decamelized = Ember.String.decamelize(type);
			return Ember.String.pluralize(decamelized);
		}
	});

	app.SessionRoute = Ember.Route.extend({
		queryParams: {
			page: 		{ refreshModel: true },
			sort_by: 	{ refreshModel: true },
			order: 		{ refreshModel: true }
		},

		paging: app.PaginationObject.create(),

		model: function (params) {
			var that = this;
			var paging = this.get('paging').getProperties('page', 'sort_by', 'order');
			
			if (params.page)
				paging.page = params.page;

			if (params.sort_by)
				paging.sort_by = params.sort_by;

			if (params.order)
				paging.order = params.order;

			return this.store.find('run_session', paging);
		},

		actions: {
			onPageChange: function (page) {
				this.set('paging.page', page);
			},

			onSortChange: function (sortBy) {
				this.set('paging.sort_by', sortBy);
			}
		}
	});

	app.SessionController = Ember.ArrayController.extend({
		queryParams: ['page', 'sort_by', 'order'],

		page: 		1,
		sort_by: 	'start_time',
		order: 		'desc',
		pagination: null,

		calculatePages: function () {
			var meta = this.store.metadataFor('run_session');
			this.set('pagination', meta.pagination);
		}.observes('model').on('init'),

		actions: {
			openSession: function (session) {
				this.transitionToRoute('session-details', session);
			},

			onPageChange: function (page) {
				this.set('page', page);
			},

			onSortChange: function (sortBy) {
				if (sortBy === this.get('sort_by')) {
					if (this.get('order') === 'desc') {
						this.set('order', 'asc');
					} else {
						this.set('order', 'desc');
					}
				} else {
					this.set('order', 'desc');
				}

				this.set('sort_by', sortBy);
			}
		}
	});

	app.SessionDetailsRoute = Ember.Route.extend({
		model: function (params) {
			// return Ember.$.getJSON('//intense-bastion-3210.herokuapp.com/run_sessions/' + params.session_id + '.json');
			return this.store.find('run_session', params.session_id);
		}
	});


	
}(this) /* Auto-invoking function */ );