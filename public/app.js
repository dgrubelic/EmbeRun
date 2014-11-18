(function (global) {
	'use strict';

	var app = Ember.Application.create();

	// Routes
	app.IndexRoute = Ember.Route.extend({
		beforeModel: function() {
			this.transitionToRoute('session');
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
		pagination: null,
		maxPages: 10,
		pages: [],

		calculatePages: function () {
			var maxPages = this.get('maxPages'),
				availablePages = this.get('pagination.available_pages'),
				currentPage = parseInt(this.get('pagination.page'), 10);

			var pages = [];

			if (currentPage >= (availablePages - maxPages - 2)) {
				pages.push(1);
				pages.push(2);

				for (var i = (availablePages - maxPages - 2); i <= availablePages; i++) {
					pages.push(i);
				}
			} else if (currentPage < (maxPages - 2)) {
				for (var i = 1; i <= (maxPages - 2); i++) {
					pages.push(i);
				}

				pages.push(availablePages - 1);
				pages.push(availablePages);
			} else {
				pages.push(1);
				pages.push(2);

				for (var i = (currentPage - 2); i <= (currentPage + 2); i++) {
					pages.push(i);
				}

				pages.push(availablePages - 1);
				pages.push(availablePages);
			}

			this.set('pages', pages);
		}.observes('pagination').on('init'),

		actions: {
			changePage: function (page) {
				this.sendAction('action', page);
			}
		}
	});

	app.Router.map(function () {
		this.route('session', { path: '/session', queryParams: ['page'] });
		this.route('session-details', { path: '/session/:session_id' });
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
			// return Ember.String.underscore(type + 's') + '.json';
			var decamelized = Ember.String.decamelize(type);
			return Ember.String.pluralize(decamelized) + '.json';
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

			return this.store.find('run_session', paging).then(function (sessions) {
				var meta = that.store.metadataFor('run_session');

				that.set('paging.total', meta.total);
				that.set('paging.available_pages', meta.available_pages);

				return sessions;
			});
		},

		actions: {
			onPageChange: function (page) {
				this.set('paging.page', page);
				// this.refresh();
			},

			onSortChange: function (sortBy) {
				this.set('paging.sort_by', sortBy);
				// this.refresh();
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
		}.observes('page').on('init'),

		actions: {
			openSession: function (session) {
				this.transitionToRoute('session-details', session);
			},

			onPageChange: function (page) {
				this.set('page', page);
			},

			onSortChange: function (sortBy) {
				this.set('sort_by', sortBy);
			}
		}
	});

	app.SessionDetailsRoute = Ember.Route.extend({
		model: function (params) {
			return Ember.$.getJSON('//intense-bastion-3210.herokuapp.com/run_sessions/' + params.session_id + '.json');
		}
	});


	
}(this) /* Auto-invoking function */ );