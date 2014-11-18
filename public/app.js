(function (global) {
	'use strict';

	var app = Ember.Application.create();

	// Routes
	app.IndexRoute = Ember.Route.extend({
		beforeModel: function() {
			this.transitionTo('session');
		}
	});

	app.Router.map(function () {
		this.route('session', { path: '/session' });
		this.route('session-details', { path: '/session/:session_id' });
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
		paging: null,

		pages: function () {
			var pages = [],
				available_pages = this.get('availablePages');

			for (var i = 1; i <= available_pages; i++) {
				pages.push(i);
			}

			return pages;
		},

		actions: {
			changePage: function (page) {
				this.sendAction('action', page);
			}
		}
	});

	app.SessionRoute = Ember.Route.extend({
		paging: app.PaginationObject.create(),

		getSessionList: function () {
			var that = this,
				paging = this.get('paging');

			return Ember.$.get('//intense-bastion-3210.herokuapp.com/run_sessions.json').then(function (response) {
				that.set('paging.page', response.meta.pagination.page);
				that.set('paging.per_page', response.meta.pagination.per_page);
				that.set('paging.available_pages', response.meta.pagination.available_pages);
				that.set('paging.sort_by', response.meta.pagination.sort_by);
				that.set('paging.order', response.meta.pagination.order);
				that.set('paging.total', response.meta.pagination.total);

				return response.run_sessions;
			});
		},

		model: function () {
			return this.getSessionList();
		}
	});

	app.SessionController = Ember.ArrayController.extend({
		page: 1,
		queryParams: ['page'],

		paging: app.PaginationObject.create(),
		sessionList: function () {
			return this.getSessionList();
		}.property('model'),
		reloadSessionList: function () {
			var sessionList = this.get('getSessionList');
			this.set('sessionList', sessionList);
		}.observes('model', 'page'),

		actions: {
			openSession: function (session) {
				this.transitionTo('session-details', session);
			},

			onPageChange: function (page) {
				this.set('page', page);
				this.set('paging.page', page);
			}
		}
	});

	app.SessionDetailsRoute = Ember.Route.extend({
		model: function (params) {
			return Ember.$.getJSON('//intense-bastion-3210.herokuapp.com/run_sessions/' + params.session_id + '.json');
		}
	});


	
}(this) /* Auto-invoking function */ );