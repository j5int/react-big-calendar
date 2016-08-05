import React from 'react';
import { findDOMNode } from 'react-dom';
import cn from 'classnames';

import Selection, { getBoundsForNode } from './Selection';
import dates from './utils/dates';
import { isSelected } from './utils/selection';
import localizer from './localizer'

import { notify } from './utils/helpers';
import { accessor } from './utils/propTypes';
import { accessor as get } from './utils/accessors';

import TimeColumn from './TimeColumn'

function snapToSlot(date, step){
  var roundTo = 1000 * 60 * step;
  return new Date(Math.floor(date.getTime() / roundTo) * roundTo)
}

function positionFromDate(date, min){
  return dates.diff(min, dates.merge(min, date), 'minutes')
}

function overlaps(event, events, { startAccessor, endAccessor, step }, last) {
  let eStart = get(event, startAccessor);
  let offset = last;

  function overlap(eventB){
    // Since the rendering of events has a minimum layout size (1 step),
    // we need to take this into account in determining the overlaps.
    let eventBStart = get(eventB, startAccessor)
    let eventBEnd = Math.max(get(eventB, endAccessor), new Date(eventBStart.valueOf() + 60*1000*step))
    return dates.lt(eStart, eventBEnd)
  }

  if (!events.length) return last - 1
  events.reverse().some(prevEvent => {
    if (overlap(prevEvent)) return true
    offset = offset - 1
  })

  return offset
}

let DaySlot = React.createClass({

  propTypes: {
    events: React.PropTypes.array.isRequired,
    step: React.PropTypes.number.isRequired,
    min: React.PropTypes.instanceOf(Date).isRequired,
    max: React.PropTypes.instanceOf(Date).isRequired,

    allDayAccessor: accessor.isRequired,
    startAccessor: accessor.isRequired,
    endAccessor: accessor.isRequired,

    selectable: React.PropTypes.bool,
    onBackgroundClick: React.PropTypes.func,
    eventOffset: React.PropTypes.number,

    onSelecting: React.PropTypes.func,
    onSelectSlot: React.PropTypes.func.isRequired,
    onSelectEvent: React.PropTypes.func.isRequired,

    className: React.PropTypes.string
  },

  getInitialState() {
    return { selecting: false };
  },


  componentDidMount() {
    if (this.props.selectable || this.props.onBackgroundClick) {
      const backgroundClickOnly = this.props.selectable ? false : true
      this._selectable(backgroundClickOnly)
    }
    this._setReferenceDates()
  },

  componentWillUnmount() {
    this._teardownSelectable();
  },

  componentWillReceiveProps(nextProps) {
    if ((nextProps.selectable || nextProps.onBackgroundClick) && !(this.props.selectable || this.props.onBackgroundClick)) {
      const backgroundClickOnly = nextProps.selectable ? false : true
      this._selectable(backgroundClickOnly)
    }
    if (!(nextProps.selectable || nextProps.onBackgroundClick) && (this.props.selectable || this.props.onBackgroundClick))
      this._teardownSelectable();
    this._setReferenceDates()
  },

  _setReferenceDates() {
    let min = new Date(this.props.min), max = new Date(this.props.max)
    while (true) {
      if (min.getTimezoneOffset() != max.getTimezoneOffset()) {
          min = dates.add(min, 1, 'day')
          max = dates.add(max, 1, 'day')
      }
      break;
    }
    this.referenceMin = min
    this.referenceMax = max
    this._totalMin = dates.diff(this.referenceMin, this.referenceMax, 'minutes')
  },

  _processTimeSlots(slots) {
    // A method to check whether there are any timezone changes
    // or other noteworthy things within a slot.
    // Currently we don't have a timezone setting and so we are not able to do this processing.
    return slots
  },

  render() {
    const {
      step,
      timeslots,
      now,
      selectRangeFormat,
      culture,
      ...props
    } = this.props

    let { selecting, startSlot, endSlot } = this.state
      , style = this._slotStyle(startSlot, endSlot, 0)

    let selectDates = {
      start: this.state.startDate,
      end: this.state.endDate
    };

    const slotCollection = { start: this.referenceMin, end: this.referenceMax,
      slots: this._processTimeSlots(this.props.slots.slice(0, this.props.slots.length)) }

    return (
      <TimeColumn {...props}
        className='rbc-day-slot'
        timeslots={timeslots}
        slotCollection={slotCollection}
        now={now}
        step={step}
      >
        {this.renderEvents()}
        {
          selecting &&
          <div className='rbc-slot-selection' style={style}>
              <span>
              { localizer.format(selectDates, selectRangeFormat, culture) }
              </span>
          </div>
        }
      </TimeColumn>
    );
  },

  renderEvents() {
    let {
      events, culture, eventPropGetter
      , selected, eventTimeRangeFormat, timeGutterFormat, eventComponent
      , startAccessor, endAccessor, titleAccessor } = this.props;

    let EventComponent = eventComponent
      , lastLeftOffset = 0;

    events.sort((a, b) => +get(a, startAccessor) - +get(b, startAccessor))

    return events.map((event, idx) => {
      let start = get(event, startAccessor)
      let end = get(event, endAccessor)
      let startSlot = positionFromDate(start, this.referenceMin);
      let endSlot = positionFromDate(end, this.referenceMin);

      lastLeftOffset = Math.max(0,
        overlaps(event, events.slice(0, idx), this.props, lastLeftOffset + 1))

      let style = this._slotStyle(startSlot, endSlot, lastLeftOffset)

      let title = get(event, titleAccessor)
      let label
      if (start.valueOf() != end.valueOf()) {
        label = localizer.format({ start, end }, eventTimeRangeFormat, culture);
      } else {
        label = localizer.format(start, timeGutterFormat, culture);
      }
      let _isSelected = isSelected(event, selected);

      if (eventPropGetter)
        var { style: xStyle, className } = eventPropGetter(event, start, end, _isSelected);

      return (
        <div
          key={'evt_' + idx}
          style={{...xStyle, ...style}}
          title={label + ': ' + title }
          onClick={this._select.bind(null, event)}
          className={cn('rbc-event', className, {
            'rbc-selected': _isSelected,
            'rbc-event-overlaps': lastLeftOffset !== 0
          })}
        >
          <div className='rbc-event-label'>{label}</div>
          <div className='rbc-event-content'>
            { EventComponent
              ? <EventComponent event={event} title={title}/>
              : title
            }
          </div>
        </div>
      )
    })
  },

  _slotStyle(startSlot, endSlot, leftOffset){

    endSlot = Math.max(endSlot, startSlot + this.props.step) //must be at least one `step` high

    let eventOffset = this.props.eventOffset || 10
      , isRtl = this.props.rtl;

    let top = ((startSlot / this._totalMin) * 100);
    let bottom = ((endSlot / this._totalMin) * 100);
    let per = leftOffset === 0 ? 0 : (leftOffset * eventOffset) % 100;
    let rightDiff = (eventOffset / (leftOffset + 1));

    return {
      top: top + '%',
      height: bottom - top + '%',
      [isRtl ? 'right' : 'left']: per + '%',
      width: (leftOffset === 0 ? (100 - eventOffset) : (100 - per) - rightDiff) + '%'
    }
  },

  _selectable(backgroundClickOnly){
    let node = findDOMNode(this);
    let selector = this._selector = new Selection(()=> findDOMNode(this))

    if (backgroundClickOnly) {
      selector
        .on('click', point => {
          this.props.onBackgroundClick(point)
        })
      return
    }

    let maybeSelect = (box) => {
      let onSelecting = this.props.onSelecting
      let current = this.state || {};
      let state = selectionState(box);
      let { startDate: start, endDate: end } = state;

      if (onSelecting) {
        if (
          (dates.eq(current.startDate, start, 'minutes') &&
          dates.eq(current.endDate, end, 'minutes')) ||
          onSelecting({ start, end }) === false
        )
          return
      }

      this.setState(state)
    }

    let selectionState = ({ y }) => {
      let { step } = this.props;
      let { top, bottom } = getBoundsForNode(node)

      let mins = this._totalMin;

      let range = Math.abs(top - bottom)

      let current = (y - top) / range;

      current = snapToSlot(minToDate(mins * current, this.referenceMin), step)

      if (!this.state.selecting)
        this._initialDateSlot = current

      let initial = this._initialDateSlot;

      if (dates.eq(initial, current, 'minutes'))
        current = dates.add(current, step, 'minutes')

      let start = dates.max(this.referenceMin, dates.min(initial, current))
      let end = dates.min(this.referenceMax, dates.max(initial, current))

      let startDate = start, endDate = end
      if (this.props.min != this.referenceMin) {
        startDate = dates.merge(this.props.min, start)
        endDate = dates.merge(this.props.min, end)
      }
      return {
        selecting: true,
        startDate,
        endDate,
        startSlot: positionFromDate(start, this.referenceMin, step),
        endSlot: positionFromDate(end, this.referenceMin, step)
      }
    }

    selector.on('selecting', maybeSelect)
    selector.on('selectStart', maybeSelect)

    selector
      .on('click', ({ x, y }) => {
        this.props.onBackgroundClick && this.props.onBackgroundClick()
        this._clickTimer = setTimeout(()=> {
          this._selectSlot(selectionState({ x, y }))
        })

        this.setState({ selecting: false })
      })

    selector
      .on('select', () => {
        if (this.state.selecting) {
          this._selectSlot(this.state)
          this.setState({ selecting: false })
        }
      })
  },

  _teardownSelectable() {
    if (!this._selector) return
    this._selector.teardown();
    this._selector = null;
  },

  _selectSlot({ startDate, endDate }) {
    let current = startDate
      , slots = [];

    while (dates.lte(current, endDate)) {
      slots.push(current)
      current = dates.add(current, this.props.step, 'minutes')
    }

    notify(this.props.onSelectSlot, {
      slots,
      start: startDate,
      end: endDate
    })
  },

  _select(event){
    clearTimeout(this._clickTimer);
    notify(this.props.onSelectEvent, event)
  }
});


function minToDate(min, date){
  var dt = new Date(date)
    , totalMins = dates.diff(dates.startOf(date, 'day'), date, 'minutes');

  dt = dates.hours(dt, 0);
  dt = dates.minutes(dt, totalMins + min);
  dt = dates.seconds(dt, 0)
  return dates.milliseconds(dt, 0)
}

export default DaySlot;
