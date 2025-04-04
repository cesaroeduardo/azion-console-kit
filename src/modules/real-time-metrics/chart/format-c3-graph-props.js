/* eslint-disable id-length */
import { CHART_RULES } from '@modules/real-time-metrics/constants'

/**
 * Check if the input is a valid date
 * @param {any} date - The input to be checked
 * @returns {boolean} - Returns true if the input is a valid date, otherwise returns false
 */
export function isDate(date, isTimeseries) {
  const parsedDate = new Date(date)
  const isValid = !isNaN(parsedDate.getTime()) && parsedDate.toString() !== 'Invalid Date'

  if (isTimeseries) return true

  //Additional check to ensure numeric like 0 and 1 are not considered valid dates
  if (typeof date === 'number' && !isTimeseries) {
    return false
  }

  return isValid
}

/**
 * Check if the input is numeric
 * @param {Array} resultChart - The result chart to be checked
 * @returns {boolean} - Returns true if the input is numeric, otherwise returns false
 */
function isNumeric(resultChart) {
  const series = resultChart[0][1]
  return typeof series === 'number'
}

/**
 * Format the C3 data properties
 * @param {Object} chartData - The chart data
 * @param {Array} resultChart - The result chart
 * @returns {Object} - Returns the formatted C3 data properties
 */
function formatC3DataProp(chartData, resultChart) {
  const { type } = chartData
  const x = resultChart[0][0]
  const columns = resultChart

  const isTimeseries = chartData.xAxis === 'ts'

  const data = {
    x,
    columns
  }

  if (type === 'ordered-bar') {
    const field = chartData.dataUnit

    data.types = { [field]: 'bar' }
    data.labels = { format: (value) => formatYAxisLabels(value, chartData) }
    data.color = (_, data) => CHART_RULES.BASE_COLOR_PATTERNS[data.index]

    return data
  }

  if (type === 'pie') {
    delete data.x
  }

  data.type = type

  if (isDate(resultChart[0][1], isTimeseries)) {
    data.xFormat = '%Y-%m-%dT%H:%M:%S.%LZ'
  }

  return data
}

/**
 * Format the C3 X Axis
 * @param {Object} chartData - The chart data
 * @param {Array} resultChart - The result chart
 * @returns {Object} - Returns the formatted C3 X Axis
 */
export function formatC3XAxis(chartData, resultChart) {
  const isTimeseries = chartData.xAxis === 'ts'

  const isSeriesDate = isDate(resultChart[0][1], isTimeseries)
  const isSeriesNumeric = isNumeric(resultChart)
  const isTimeSeries = chartData.xAxis === 'ts'
  const isRotated = chartData.rotated

  const xAxis = {
    type: isSeriesDate ? CHART_RULES.C3_TYPES.ts : CHART_RULES.C3_TYPES.cat
  }

  if (isTimeSeries) {
    xAxis.tick = {
      count: isSeriesNumeric ? CHART_RULES.MAX_COUNT : CHART_RULES.MIN_COUNT,
      outer: false
    }
  }

  if (isSeriesDate) {
    xAxis.tick = {
      ...xAxis.tick,
      format: '%b-%d %H:%M',
      width: CHART_RULES.LABEL.width
    }
  }

  if (isRotated && !isSeriesDate) {
    xAxis.min = CHART_RULES.RESET_COUNT
    xAxis.tick = {
      ...xAxis.tick,
      width: CHART_RULES.LABEL.rotatedWidth,
      multiline: true,
      multilineMax: 2
    }
  }

  return xAxis
}

/**
 * Format data for percentage display
 * @param {number} data - The data to be formatted
 * @returns {string} - Returns the formatted data for percentage display
 */
function formatPercentageDataUnit(data) {
  return Intl.NumberFormat('en', {
    style: 'percent',
    maximumFractionDigits: CHART_RULES.TO_FIXED_PERCENTAGE,
    minimumFractionDigits: CHART_RULES.TO_FIXED_PERCENTAGE
  }).format(data / 100)
}

function calculateValueAndUnit(data, unit) {
  if (data > CHART_RULES.DATA_VOLUME.tera) {
    return { value: data / CHART_RULES.DATA_VOLUME.tera, formattedUnit: `tera${unit}` }
  }
  if (data > CHART_RULES.DATA_VOLUME.giga) {
    return { value: data / CHART_RULES.DATA_VOLUME.giga, formattedUnit: `giga${unit}` }
  }
  if (data > CHART_RULES.DATA_VOLUME.mega) {
    return { value: data / CHART_RULES.DATA_VOLUME.mega, formattedUnit: `mega${unit}` }
  }
  if (data > CHART_RULES.DATA_VOLUME.kilo) {
    return { value: data / CHART_RULES.DATA_VOLUME.kilo, formattedUnit: `kilo${unit}` }
  }
  return { value: data, formattedUnit: unit }
}

/**
 * Format data for displaying byte unit
 * @param {number} data - The data to be formatted
 * @param {Object} chartData - The chart data
 * @returns {string} - Returns the formatted data for byte unit display
 */
function formatBytesDataUnit(data, chartData) {
  const unit = chartData.dataUnit === 'bitsPerSecond' ? 'bit-per-second' : 'byte'

  const { value, formattedUnit } = calculateValueAndUnit(Math.abs(data), unit)

  const formattedData = Intl.NumberFormat('en', {
    notation: 'compact',
    style: 'unit',
    unit: formattedUnit,
    unitDisplay: 'narrow',
    minimumFractionDigits: CHART_RULES.TO_FIXED_DATA_VOLUME,
    maximumFractionDigits: CHART_RULES.TO_FIXED_DATA_VOLUME
  }).format(value)

  const isNegativeData = data < 0

  return isNegativeData ? `-${formattedData}` : formattedData
}

/**
 * Formats the data unit
 * @param {number} data - The data to be formatted
 * @returns {string} - Returns the formatted data unit
 */
function formatDataUnit(data) {
  const formatter = Intl.NumberFormat('en', { notation: 'compact' })
  return `${formatter.format(data)}`
}

/**
 * Formats the Y axis labels for the C3 chart
 * @param {number} data - The data to be formatted
 * @param {Object} chartData - The chart data
 * @returns {string} - Returns the formatted Y axis labels for the C3 chart
 */
export function formatYAxisLabels(data, chartData) {
  if (chartData.dataUnit === 'bytes' || chartData.dataUnit === 'bitsPerSecond') {
    return formatBytesDataUnit(data, chartData)
  }
  if (chartData.dataUnit === 'percentage') {
    return formatPercentageDataUnit(data)
  }

  const value = formatDataUnit(data)
  if (chartData.dataUnit === 'perSecond') {
    return `${value}/s`
  }

  return value
}

/**
 * Formats the Y axis of the C3 chart
 * @param {Object} chartData - The chart data
 * @returns {Object} - Returns the formatted Y axis of the C3 chart
 */
export function formatC3YAxis(chartData, hasCount = true) {
  const hiddenTypes = ['ordered-bar']

  if (hiddenTypes.includes(chartData.type)) {
    return { show: false }
  }
  const isRotated = chartData.rotated
  const yAxis = {
    /**
     * Configuration of the Y axis tick
     */
    tick: {
      format: (d) => formatYAxisLabels(d, chartData)
    },
    min: !isRotated ? CHART_RULES.RESET_COUNT : undefined,
    padding: { bottom: 0 }
  }

  if (hasCount) {
    yAxis.tick.count = CHART_RULES.MAX_COUNT
  }
  if (chartData.maxYAxis) {
    yAxis.max = chartData.maxYAxis
    yAxis.padding.top = 0
  }

  return yAxis
}

/**
 * Sets the legend position based on the window width and chart data
 * @param {Object} chartData - The chart data
 * @param {Array} resultChart - The result of the chart
 * @returns {string} - Returns the legend position based on the conditions
 */
function setLegendPosition(chartData, resultChart) {
  if (window.innerWidth < CHART_RULES.SCREEN_SMALL_BREAKPOINT) {
    return 'bottom'
  }

  const seriesGreaterThanFive = resultChart && resultChart.slice(1).length > 5
  const columnsGreaterThanTwo = chartData && chartData.columns > 2

  return seriesGreaterThanFive && columnsGreaterThanTwo ? 'right' : 'bottom'
}

/**
 * Generates mean line values for the C3 chart
 * @param {Array} resultChart - The result of the chart
 * @param {number} mean - The mean value
 * @returns {Array} - Returns the mean line values for the C3 chart
 */
function generateMeanLineValues(resultChart, mean) {
  const withoutTsSeries = resultChart.slice(1)
  const numberOfSeries = withoutTsSeries[0]?.slice(1).length
  const meanValues = Array(numberOfSeries).fill(mean)

  return [CHART_RULES.MEAN_LINE_LABEL, ...meanValues]
}

/**
 * Converts a camelCase string to title case
 * @param {string} text - The camelCase string to convert
 * @returns {string} - The title case string
 */
export function camelToTitle(text) {
  if (!text) return
  return text
    .replace(/([a-z])([A-Z0-9])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

/**
 * Sets the mean series values for the C3 chart
 * @param {Array} serie - The series data
 * @param {number} seriesTotal - The total of the series
 * @param {Object} chartData - The chart data
 * @returns {Object} - Returns the mean series values and legend for the C3 chart
 */
function setMeanSeriesValues(serie, seriesTotal, chartData) {
  const serieCount = serie.length - 1
  const serieAvg = seriesTotal / serieCount
  const serieMeanLineValues = new Array(serieCount)
  const serieMeanLineLegend = new Array(serieCount)
  const formatedLabelValue = formatYAxisLabels(serieAvg, chartData)
  const serieName = camelToTitle(serie[0])
  serieMeanLineValues.fill(serieAvg).unshift(`${CHART_RULES.MEAN_LINE_LABEL} - ${serieName}`)
  serieMeanLineLegend
    .fill(serieAvg)
    .unshift(`${CHART_RULES.MEAN_LINE_LABEL} - ${serieName} - ${formatedLabelValue}`)

  return { serieMeanLineLegend, serieMeanLineValues }
}

/**
 * Get series information for the C3 chart
 * @param {Array} resultChart - The result of the chart
 * @param {Object} chartData - The chart data
 * @param {boolean} hasMeanLineSeries - Indicates if the chart has mean line series
 * @param {boolean} hasMeanLineTotal - Indicates if the chart has mean line total
 * @returns {Object} - Returns the series names, mean line total, and mean line series for the C3 chart
 */
export function getSeriesInfos(resultChart, chartData, hasMeanLineSeries, hasMeanLineTotal) {
  const sliced = resultChart.slice(1)

  let seriesNames = {}
  let seriesAccumulator = 0
  let numberOfSeries = 0
  const meanLineSeries = []
  let meanLineTotal = []

  sliced.forEach((series) => {
    let seriesTotal = series.slice(1).reduce((acc, value) => acc + value, 0)

    if (hasMeanLineTotal) {
      seriesAccumulator += seriesTotal
      numberOfSeries += series.slice(1).length
    }
    if (chartData.aggregationType === 'avg' && series.length > 1) {
      seriesTotal /= series.length - 1
    }
    const formattedSeriesTotal = formatYAxisLabels(seriesTotal, chartData)
    const seriesName = !chartData?.doNotConvertToCamelCase ? camelToTitle(series[0]) : series[0]
    const renamedSeries = `${seriesName} - ${formattedSeriesTotal}`

    seriesNames = { ...seriesNames, [series[0]]: renamedSeries }

    // MeanLine Series
    if (hasMeanLineSeries) {
      const { serieMeanLineLegend, serieMeanLineValues } = setMeanSeriesValues(
        series,
        seriesTotal,
        chartData
      )
      const renamedSerie = { [serieMeanLineValues[0]]: serieMeanLineLegend[0] }
      seriesNames = { ...seriesNames, ...renamedSerie }
      meanLineSeries.push(serieMeanLineValues)
    }
  })

  if (hasMeanLineTotal) {
    const mean = seriesAccumulator / numberOfSeries
    const formattedMeanValues = formatYAxisLabels(mean, chartData)
    const meanLineLabel = `${CHART_RULES.MEAN_LINE_LABEL} - ${formattedMeanValues}`
    seriesNames = { ...seriesNames, [CHART_RULES.MEAN_LINE_LABEL]: meanLineLabel }

    meanLineTotal = generateMeanLineValues(resultChart, mean)
  }
  return { seriesNames, meanLineTotal, meanLineSeries }
}

/**
 * Resets the tooltip label by converting the ID to title case
 * @param {Array} tooltipData - The tooltip data to reset
 * @returns {Array} - The tooltip data with the label reset
 */
function resetTooltipLabel(tooltipData, chartData) {
  return tooltipData.map((item) => ({
    ...item,
    name: !chartData?.doNotConvertToCamelCase ? camelToTitle(item.id) : item.id
  }))
}

/**
 * Sets the padding for the legend based on the legend position
 * @param {string} legendPosition - The position of the legend
 * @returns {Object|null} - The legend padding object or null
 */
function setLegendPadding(legendPosition) {
  return legendPosition === 'bottom' ? CHART_RULES.BOTTOM_LEGEND_PADDING : null
}

/**
 * Determines whether the grid should be displayed for the given chart data.
 *
 * @param {Object} chartData - The chart data to check.
 * @return {Boolean}
 */
function displayGrid(chartData) {
  const hiddenTypes = ['ordered-bar']

  return !hiddenTypes.includes(chartData.type)
}

/**
 * Determines whether the legend should be hidden for the given chart data.
 *
 * @param {Object} chartData - The chart data to check.
 * @return {Boolean}
 */
function displayLegend(chartData) {
  const hiddenTypes = ['ordered-bar']

  return hiddenTypes.includes(chartData.type)
}

/**
 * Format the properties for the C3 graph
 *
 * @param {Object} options - The options object
 * @param {Array} options.chartData - The chart data
 * @param {Array} options.resultChart - The result chart
 * @param {boolean} options.hasMeanLineSeries - Flag indicating if the chart has mean line series
 * @param {boolean} options.hasMeanLineTotal - Flag indicating if the chart has mean line total
 * @returns {Object} The formatted C3 graph properties
 */
export function FormatC3GraphProps({
  chartData,
  resultChart,
  hasMeanLineSeries = false,
  hasMeanLineTotal = false
}) {
  const timeSeriesInfo = {
    seriesNames: null,
    meanLineTotal: null,
    meanLineSeries: null
  }

  const pattern = [...CHART_RULES.BASE_COLOR_PATTERNS]

  const legendPosition = setLegendPosition(chartData, resultChart)

  const isTimeseries = chartData.xAxis === 'ts'

  if (isTimeseries) {
    const { seriesNames, meanLineTotal, meanLineSeries } = getSeriesInfos(
      resultChart,
      chartData,
      hasMeanLineSeries,
      hasMeanLineTotal
    )

    timeSeriesInfo.seriesNames = seriesNames
    timeSeriesInfo.meanLineSeries = meanLineSeries
    timeSeriesInfo.meanLineTotal = meanLineTotal
  }

  const data = {
    ...formatC3DataProp(chartData, resultChart)
  }

  if (isTimeseries) {
    data.names = timeSeriesInfo.seriesNames
  }

  if (hasMeanLineTotal && resultChart.length > 1) {
    const meanLineIndex = resultChart.length - 1
    pattern.splice(meanLineIndex, 0, CHART_RULES.MEAN_LINE_PATTERN)

    data.columns = [...data.columns, timeSeriesInfo.meanLineTotal]
  }

  if (hasMeanLineSeries && resultChart.length > 1) {
    const meanLineIndexCount = hasMeanLineTotal ? 0 : -1
    const meanLineSeriesIndex = resultChart.length + meanLineIndexCount
    const existsColorPattern = pattern.slice(0, meanLineSeriesIndex)
    pattern.splice(meanLineSeriesIndex, 0, ...existsColorPattern)
    data.columns = [...data.columns, ...timeSeriesInfo.meanLineSeries]
  }

  const showFocus = (chartData) => {
    return chartData.type !== 'ordered-bar'
  }

  const handleAxis = () => {
    const axis = {
      rotated: chartData.rotated,
      x: formatC3XAxis(chartData, resultChart),
      y: formatC3YAxis(chartData)
    }

    if (chartData.type === 'pie') {
      return null
    }

    return axis
  }

  const formatGauge = () => {
    const threshold = chartData.threshold || [30, 60, 90]
    const maxSupportedValue = threshold.at(-1)
    const color = CHART_RULES.GAUGE_COLOR_SCHEMA[chartData.variationType]

    return {
      gauge: {
        label: {
          format: function (value) {
            return `${formatYAxisLabels(value, chartData)}`
          },
          show: false
        },
        max: maxSupportedValue
      },
      color: {
        pattern: color,
        threshold: {
          values: threshold
        }
      }
    }
  }

  const c3Props = {
    data,
    axis: { ...handleAxis() },
    legend: { position: legendPosition, hide: displayLegend(chartData) },
    padding: setLegendPadding(legendPosition),
    color: { pattern },
    grid: {
      y: {
        show: displayGrid(chartData)
      },
      focus: {
        show: showFocus(chartData)
      }
    },
    point: {
      show: false
    },
    tooltip: {
      show: window.innerWidth > CHART_RULES.SCREEN_XSMALL_BREAKPOINT,
      contents(d, defaultTitleFormat, defaultValueFormat, color) {
        if (chartData.type === 'ordered-bar') {
          const { index } = d[0]
          return this.getTooltipContent(
            resetTooltipLabel(d, chartData),
            defaultTitleFormat,
            defaultValueFormat,
            () => CHART_RULES.BASE_COLOR_PATTERNS[index]
          )
        }

        return this.getTooltipContent(
          resetTooltipLabel(d, chartData),
          defaultTitleFormat,
          defaultValueFormat,
          color
        )
      },
      format: {
        title: (d) => {
          if (isDate(d, isTimeseries)) {
            return new Date(d).toLocaleString('en-US')
          }
          if (typeof d === 'number') {
            return null
          }
          return d
        },
        name: (name, _, __, idx) => {
          if (chartData.type === 'ordered-bar') {
            return resultChart[0][idx + 1]
          }

          return name
        },
        value: function (value) {
          return formatYAxisLabels(value, chartData)
        }
      }
    },
    zoom: {
      enabled: chartData.xAxis === 'ts'
    }
  }

  if (chartData.type === 'gauge') {
    delete c3Props.data.x
    delete c3Props.axis
    delete c3Props.grid

    const { gauge, color } = formatGauge()
    c3Props.gauge = gauge
    c3Props.color = color
  }

  return c3Props
}
