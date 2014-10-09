/** @jsx React.DOM */

require('../../styles/sketch.scss');

var React = require('react');
var Fluxxor = require("fluxxor");
var FluxChildMixin = Fluxxor.FluxChildMixin(React);
var StoreWatchMixin = Fluxxor.StoreWatchMixin;
var RandomLines = require('./RandomLines');
var _ = require('lodash');
var geom = require('../../geom/index');
var Lines = require('./Lines');
var Slider = require("../Slider");
var cx = require('react/addons').addons.classSet;

var Sketch = React.createClass({

  mixins: [FluxChildMixin, StoreWatchMixin("Grid")],

  getStateFromFlux: function() {
    var flux = this.getFlux();
    var state = flux.store("Grid").getState();
    var type = state.type;
    var grid = geom.grid[type]({
      columns: 1, rows: 1, size: 200
    });
    var vertices = grid[0].points;

    return {
      type: type,
      vertices: vertices,
      center: grid,
      grid: geom.sketchRaster[type](vertices, state.rasterSize),
      lines: state.pattern
    };
  },

  render: function() {
    var translate = '';
    if (this.state.type === 'hex') {
      translate = 'translate(-75, -45)';
    }
    var step = this.state.type === 'hex' ? 2 : 1;

    var classes = cx({
      sketch: true,
      preview: this.state.preview
    });
    /* jshint ignore:start */
    return <div>
      <svg className={classes} onMouseDown={this.startLine} onMouseUp={this.endLine} onMouseMove={this.updatePreview} onClick={this.endPreview} >
        <g transform={translate} >
          <polygon points={this.state.vertices} />
      {this.state.grid.map(function(c, i) {
        var key = 'p_' + i;
        return <circle cx={c.x} cy={c.y} r="1" key={key}/>
      })}
          <Lines lines={this.state.lines} preview={{
            state: this.state.preview,
            s: this.state.startPoint,
            e: this.state.previewEndPoint
          }}/>

        </g>
      </svg>
      <Slider type="rasterSize" min="2" max="20" step={step}/>
      <button onClick={this.clear}>Clear</button>
      <RandomLines grid={this.state.grid}/>
    </div>;
    /* jshint ignore:end */
  },

  getOffset: function(e) {
    var node = this.getDOMNode();
    var x = e.clientX - node.offsetLeft;
    var y = e.clientY - node.offsetTop;

    if (this.state.type === 'hex') {
      x += 75;
      y += 45;
    }
    return {x: x, y: y};
  },
  startLine: function(e) {
    if (e.altKey) {
      return;
    }
    this.setState({
      startPoint: geom.nearestPoint(this.state.grid, this.getOffset(e)),
      previewEndPoint: geom.nearestPoint(this.state.grid, this.getOffset(e)),
      preview: true
    });
  },

  updatePreview: function(e) {
    if (this.state.preview) {
      this.setState({previewEndPoint: geom.nearestPoint(this.state.grid, this.getOffset(e))});
    }
  },

  endPreview: function() {
    this.setState({preview: false});
  },

  endLine: function(e) {
    var lines = this.state.lines;
    if (e.altKey) {
      var line = this.removeLine(e, lines);
      this.getFlux().actions.removeLines(line);
      return;
    } else {
      var endPoint = geom.nearestPoint(this.state.grid, this.getOffset(e));
    }
    this.getFlux().actions.addLine([this.state.startPoint, endPoint]);
  },

  clear: function() {
    this.getFlux().actions.removeLines([]);
  },

  removeLine: function(e, lines) {
    var offset = this.getOffset(e);

    return lines.filter(function(line) {
      return geom.distanceToLine(offset.x, offset.y, line[0].x, line[0].y, line[1].x, line[1].y) > 3;
    }, this);
  }

});

module.exports = Sketch;