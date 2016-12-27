// Select one of an array of chart types.
// Delete chartProps that are "private" to certain chart types (namespaced with `_`)
// and apply setting that carry over to the new type

var React = require("react");
var clone = require("lodash/clone");
var map = require("lodash/map");
var keys = require("lodash/keys");
var helper = require("../util/helper");
var concat = require("lodash/concat");

// Flux actions
var ChartServerActions = require("../actions/ChartServerActions");

// Chartbuilder UI components
var chartbuilderUI = require("chartbuilder-ui");
var ButtonGroup = chartbuilderUI.ButtonGroup;

var chartConfig = require("../charts/charts/chart-config");
var mapConfig = require("../charts/maps/map-config");

/**
 * Select a new chart type, copying shared settings over to the new type.
 * @instance
 * @memberof editors
 */
var ChartTypeSelctor = React.createClass({

	/* Generate values for each chart type that can be used to create buttons */
	getInitialState: function() {
		//var typesConfig =
		var chartTypeButtons = map(keys(chartConfig), function(chartTypeKey) {
			return {
				title: chartConfig[chartTypeKey].displayName,
				content: chartConfig[chartTypeKey].displayName,
				value: chartTypeKey
			};
		});
		var mapTypeButtons = map(keys(mapConfig), function(mapTypeKey) {
			return {
				title: mapConfig[mapTypeKey].displayName,
				content: mapConfig[mapTypeKey].displayName,
				value: mapTypeKey
			};
		});
		var allTypeButtons = concat(chartTypeButtons, mapTypeButtons);
		return { chartConfig: allTypeButtons };
	},

	/*
	 * Change the chart type
	 * @param {string} chartType - the new chart type
	*/
	_handleChartTypeChange: function(chartType) {
		/* Dont rerender if the chart type is the same */

		if (chartType === this.props.metadata.chartType) {
			return;
		}

		const visualConfig = chartConfig[chartType] || mapConfig[chartType];

		const metadata = clone(this.props.metadata);
		/* Set the new chart type in metadata */
		metadata.chartType = chartType;
		/* Set the new visual type in metadata */
		metadata.visualType = visualConfig.defaultProps.metadata.visualType;

		const prevProps = this.props.chartProps;
		const newDefaultProps = visualConfig.defaultProps.chartProps;
		const stylings = newDefaultProps.stylings;
		const prevSettings = prevProps.chartSettings;
		const newDefaultSettings = newDefaultProps.chartSettings[0];
		const prevKeys = keys(prevSettings[0]);

		/* Apply any settings that carry over, otherwise ignore them */
		const newProps = helper.mergeOrApply(newDefaultProps, prevProps);

		/*
		 * For each data series, check whether a `chartSetting` has already been
		 * defined by another chart type. If so, apply it. If not, use the new
		 * type's default
		*/
		newProps.chartSettings = map(prevProps.data, function(d, i) {
			return helper.mergeOrApply(newDefaultSettings, prevSettings[i]);
		});

		newProps.stylings = stylings;

		/* Dispatch the new model to the flux stores */
		ChartServerActions.receiveModel({
			chartProps: newProps,
			metadata: metadata
		});
	},

	render: function() {

		return (
		<div className="editor-options">
			<h2>
				<span className="step-number">1</span>
				<span>Select visual type</span>
			</h2>
			<ButtonGroup
				buttons={this.state.chartConfig}
				onClick={this._handleChartTypeChange}
				className="chart-type-select"
				value={this.props.metadata}
			/>
		 </div>
		);
	}

});

module.exports = ChartTypeSelctor;
