
/**
 * The MapMiniDrawingView view.
 *
 * @return MapMiniDrawingView view (extends Backbone.View)
 */
define([
  'underscore',
  'mps',
  'core/View',
], function(_, mps, View) {

  'use strict';

  var MapMiniDrawingView = View.extend({

    el: '#map-drawing',

    events: {
      'click' : 'onClickDrawing'
    },

    status: new (Backbone.Model.extend({
      defaults: {
        is_drawing: false,
        is_drawn: false,
        geosjon: null,
        overlay: null,
        overlay_stroke_weight: 2
      }
    })),

    initialize: function(map) {
      if (!this.$el.length) {
        return;
      }

      View.prototype.initialize.apply(this);

      this.map = map;
      this.listeners();
    },

    _subscriptions: [
      // HIGHLIGHT
      {
        'Drawing/toggle': function(toggle){
          this.status.set('is_drawing', toggle);
        }
      },
      {
        'Drawing/overlay': function(overlay){
          this.status.set('is_drawn', true);
        }
      },
      {
        'Drawing/delete': function(overlay){
          this.status.set('is_drawn', false);
        }
      }
    ],

    listeners: function() {
      // Status listeners
      this.listenTo(this.status, 'change:is_drawing', this.changeIsDrawing.bind(this));
      this.listenTo(this.status, 'change:is_drawn', this.changeIsDrawing.bind(this));
    },


    // CHANGE EVENTS
    changeIsDrawing: function() {
      var is_drawing = this.status.get('is_drawing');
      var is_drawn = this.status.get('is_drawn');
      this.setDrawingButton();

      if (is_drawing) {
        this.$el.text('Cancel');
        this.startDrawingManager();
      } else {
        if (is_drawn) {
          this.$el.text('Delete drawing');
        } else {
          this.$el.text('Start drawing');
        }
        this.stopDrawingManager();
      }
    },

    setDrawingButton: function() {
      var is_drawing = this.status.get('is_drawing'),
          is_drawn = this.status.get('is_drawn'),
          green = !is_drawing && !is_drawn,
          gray = is_drawing && !is_drawn,
          red = !is_drawing && is_drawn;

      this.$el
        .toggleClass('green', green)
        .toggleClass('gray', gray)
        .toggleClass('red', red);

    },

    /**
     * DRAWING MANAGER
     * - onClickDrawing
     */
    onClickDrawing: function(e) {
      e && e.preventDefault();
      var is_drawing = this.status.get('is_drawing'),
          is_drawn = this.status.get('is_drawn');

      mps.publish('Drawing/delete');
      mps.publish('Drawing/toggle', [!is_drawing && !is_drawn]);
    },


    /**
     * DRAWING MANAGER
     *
     * startDrawingManager
     * @return {void}
     */
    startDrawingManager: function() {
      this.drawingManager = new google.maps.drawing.DrawingManager({
        map: this.map,
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: false,
        polygonOptions: {
          editable: true,
          strokeWeight: 2,
          fillOpacity: 0,
          fillColor: '#FFF',
          strokeColor: '#A2BC28',
        },
        panControl: false,
      });

      // Bindings
      $(document).on('keyup.drawing', function(e){
        if (e.keyCode == 27) {
          mps.publish('Drawing/toggle', [false]);
        }
      }.bind(this));

      google.maps.event.addListener(this.drawingManager, 'overlaycomplete', this.completeDrawing.bind(this));
    },

    /**
     * stopDrawingManager
     * @return {void}
     */
    stopDrawingManager: function() {
      if (this.drawingManager) {
        this.drawingManager.setDrawingMode(null);
        this.drawingManager.setMap(null);
      }

      // Bindings
      $(document).off('keyup.drawing');
      google.maps.event.clearListeners(this.drawingManager, 'overlaycomplete');
    },

    /**
     * completeDrawing
     * @param  {[object]} e
     * @return {void}
     */
    completeDrawing: function(e) {
      this.stopDrawingManager();

      // Check if the drawing is enabled
      if (this.status.get('is_drawing')) {
        mps.publish('Drawing/overlay', [e.overlay, { save: true }]);
        mps.publish('Drawing/toggle', [false]);
      } else {
        mps.publish('Drawing/overlay', [e.overlay, { save: false }]);
        mps.publish('Drawing/toggle', [false]);
        mps.publish('Drawing/delete');
      }
    },

  });

  return MapMiniDrawingView;

});
